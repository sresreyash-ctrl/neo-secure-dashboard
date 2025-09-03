package providers

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/smithy-go/logging"
	"github.com/datadog/stratus-red-team/v2/internal/utils"
	"github.com/google/uuid"
)

type AWSProvider struct {
	awsConfig           *aws.Config
	UniqueCorrelationId uuid.UUID // unique value injected in the user-agent, to differentiate Stratus Red Team executions
}

func NewAWSProvider(uuid uuid.UUID) *AWSProvider {
	var opts []func(*config.LoadOptions) error
	opts = append(opts, utils.CustomUserAgentApiOptions(uuid))

	// Enable debug logging if requested
	if os.Getenv("STRATUS_AWS_DEBUG") == "1" {
		opts = append(opts,
			config.WithLogger(logging.NewStandardLogger(os.Stdout)),
			config.WithClientLogMode(aws.LogRequestWithBody|aws.LogResponseWithBody|aws.LogRetries),
		)
	}

	cfg, err := config.LoadDefaultConfig(context.Background(), opts...)
	if err != nil {
		log.Fatalf("unable to load AWS configuration, %v", err)
	}
	return &AWSProvider{UniqueCorrelationId: uuid, awsConfig: &cfg}
}
func (m *AWSProvider) GetConnection() aws.Config {
	return *m.awsConfig
}

func (m *AWSProvider) IsAuthenticatedAgainstAWS() bool {
	// We make a sample API call to AWS to ensure the user is authenticated
	// Note: We use ec2:DescribeAccountAttributes as an arbitrary API call
	// instead of sts:GetCallerIdentity, to ensure an AWS region was properly set
	ec2Client := ec2.NewFromConfig(m.GetConnection())
	_, err := ec2Client.DescribeAccountAttributes(context.Background(), &ec2.DescribeAccountAttributesInput{})
	if err != nil {
		return false
	}

	// Note: Explicitly setting AWS_REGION/AWS_DEFAULT_REGION is not strictly required for the AWS SDK to work, but it is necessary for Terraform
	// If it's not set, we get a user-unfriendly error such as the one describe at https://github.com/DataDog/stratus-red-team/issues/506
	if os.Getenv("AWS_REGION") == "" && os.Getenv("AWS_DEFAULT_REGION") == "" {
		return false
	}

	return true
}
