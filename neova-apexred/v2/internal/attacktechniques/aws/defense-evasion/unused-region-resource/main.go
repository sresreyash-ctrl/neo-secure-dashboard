package aws

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus/mitreattack"
	"github.com/google/uuid"
)

// State represents the information we need to persist between detonation and revert
type State struct {
	BucketName string `json:"bucket_name"`
	Region     string `json:"region"`
}

func init() {
	stratus.GetRegistry().RegisterAttackTechnique(&stratus.AttackTechnique{
		ID:                 "aws.defense-evasion.unused-region-resource",
		FriendlyName:       "Create Resource in an Unused AWS Region",
		Platform:           stratus.AWS,
		IsIdempotent:       false,
		MitreAttackTactics: []mitreattack.Tactic{mitreattack.DefenseEvasion},
		Description: `
Simulates an adversary creating a resource in an unused or rarely monitored AWS region to evade detection.
This technique dynamically identifies an AWS region that does not have any EC2 instances and creates an S3 bucket in it.
`,
		Detection: `
- Monitor CloudTrail for API calls that create resources (e.g., ` + "`s3:CreateBucket`" + `) in AWS regions that are not typically used by your organization.
- Use AWS Config to deploy rules that detect resource creation in non-standard regions.
- Correlate resource creation events with the identity that performed them. An identity suddenly acting in a new region can be suspicious.
`,
		PrerequisitesTerraformCode: nil,
		Detonate:                   detonate,
		Revert:                     revert,
	})
}

// detonate finds an unused region, creates a bucket, and writes the state to a temp file.
func detonate(params map[string]string, providers stratus.CloudProviders) error {
	log.Println("[neova-apexred] Starting dynamic attack: Finding an unused AWS region to create a resource...")

	targetRegion, err := findUnusedRegion(providers.AWS().GetConnection())
	if err != nil {
		return fmt.Errorf("could not find an unused region: %w", err)
	}
	log.Printf("[neova-apexred] Identified unused region: %s", targetRegion)

	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(targetRegion))
	if err != nil {
		return fmt.Errorf("unable to load AWS config for region %s: %w", targetRegion, err)
	}
	s3Client := s3.NewFromConfig(cfg)
	bucketName := "neova-unused-region-" + uuid.New().String()

	log.Printf("[neova-apexred] Creating S3 bucket '%s' in region '%s'", bucketName, targetRegion)
	createBucketInput := &s3.CreateBucketInput{Bucket: &bucketName}
	if targetRegion != "us-east-1" {
		createBucketInput.CreateBucketConfiguration = &types.CreateBucketConfiguration{
			LocationConstraint: types.BucketLocationConstraint(targetRegion),
		}
	}
	_, err = s3Client.CreateBucket(context.Background(), createBucketInput)
	if err != nil {
		return fmt.Errorf("failed to create S3 bucket: %w", err)
	}
	log.Println("[neova-apexred] Successfully created S3 bucket in an unused region.")

	// Persist state to a temporary file
	state := State{BucketName: bucketName, Region: targetRegion}
	return writeStateToFile(params, &state)
}

// revert reads the state from the temp file and deletes the created bucket.
func revert(params map[string]string, providers stratus.CloudProviders) error {
	// Read state from file
	state, err := readStateFromFile(params)
	if err != nil {
		return fmt.Errorf("could not retrieve attack state: %w", err)
	}

	if state.BucketName == "" || state.Region == "" {
		return errors.New("bucket name or region not found in attack state, cannot revert")
	}

	log.Printf("[neova-apexred] Reverting attack: Deleting S3 bucket '%s' from region '%s'", state.BucketName, state.Region)
	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(state.Region))
	if err != nil {
		return fmt.Errorf("unable to load AWS config for region %s: %w", state.Region, err)
	}

	s3Client := s3.NewFromConfig(cfg)
	_, err = s3Client.DeleteBucket(context.Background(), &s3.DeleteBucketInput{
		Bucket: &state.BucketName,
	})
	if err != nil {
		return fmt.Errorf("failed to delete S3 bucket '%s': %w", state.BucketName, err)
	}

	log.Printf("[neova-apexred] Successfully deleted S3 bucket '%s'.", state.BucketName)

	// Clean up the state file
	return os.Remove(getStateFilePath(params))
}

// getStateFilePath returns a unique path for the state file based on the execution ID
func getStateFilePath(params map[string]string) string {
	execId := params["execId"]
	if execId == "" {
		// Fallback for safety, though execId should always be present
		execId = "default"
	}
	return filepath.Join(os.TempDir(), fmt.Sprintf("neova-apexred-state-%s.json", execId))
}

// writeStateToFile serializes the state struct to a JSON file
func writeStateToFile(params map[string]string, state *State) error {
	path := getStateFilePath(params)
	log.Printf("[neova-apexred] Persisting state to %s", path)
	content, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("failed to serialize state: %w", err)
	}
	return os.WriteFile(path, content, 0644)
}

// readStateFromFile deserializes the state struct from a JSON file
func readStateFromFile(params map[string]string) (*State, error) {
	path := getStateFilePath(params)
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read state file %s: %w", path, err)
	}
	var state State
	err = json.Unmarshal(content, &state)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize state: %w", err)
	}
	return &state, nil
}

// findUnusedRegion identifies an enabled AWS region with no EC2 instances.
func findUnusedRegion(cfg aws.Config) (string, error) {
	ec2Client := ec2.NewFromConfig(cfg)
	regionsOutput, err := ec2Client.DescribeRegions(context.Background(), &ec2.DescribeRegionsInput{
		AllRegions: aws.Bool(false),
	})
	if err != nil {
		return "", fmt.Errorf("failed to describe regions: %w", err)
	}
	var unusedRegions []string
	usedRegions := make(map[string]bool)
	log.Println("[neova-apexred] Checking for EC2 instances in all enabled regions...")
	for _, region := range regionsOutput.Regions {
		regionName := *region.RegionName
		if regionName == "ap-northeast-3" {
			continue
		}
		regionCfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(regionName))
		if err != nil {
			log.Printf("Warning: could not load config for region %s: %v", regionName, err)
			continue
		}
		regionalEc2Client := ec2.NewFromConfig(regionCfg)
		instancesOutput, err := regionalEc2Client.DescribeInstances(context.Background(), &ec2.DescribeInstancesInput{})
		if err != nil {
			log.Printf("Warning: could not describe instances in region %s: %v", regionName, err)
			continue
		}
		if len(instancesOutput.Reservations) > 0 {
			usedRegions[regionName] = true
		} else {
			unusedRegions = append(unusedRegions, regionName)
		}
	}
	if len(unusedRegions) == 0 {
		return "", errors.New("no unused AWS regions found (all checked regions have EC2 instances)")
	}
	log.Printf("[neova-apexred] Found %d unused region(s). Used regions: %v", len(unusedRegions), getKeys(usedRegions))
	rand.Seed(time.Now().UnixNano())
	return unusedRegions[rand.Intn(len(unusedRegions))], nil
}

func getKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
