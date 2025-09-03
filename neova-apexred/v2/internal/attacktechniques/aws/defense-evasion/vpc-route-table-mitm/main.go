package aws

import (
	"context"
	_ "embed"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus/mitreattack"
)

//go:embed main.tf
var tf []byte

func init() {
	stratus.GetRegistry().RegisterAttackTechnique(&stratus.AttackTechnique{
		ID:                 "aws.defense-evasion.vpc-route-table-mitm",
		FriendlyName:       "VPC Route Table Manipulation (Man-in-the-Middle)",
		Platform:           stratus.AWS,
		IsIdempotent:       true,
		MitreAttackTactics: []mitreattack.Tactic{mitreattack.CredentialAccess, mitreattack.DefenseEvasion},
		Description: `
Simulates a man-in-the-middle attack by manipulating a VPC route table to redirect traffic (0.0.0.0/0) to an attacker-controlled instance.

Warm-up:
- Create a VPC, subnet, two EC2 instances (victim and attacker), and a route table with a route sending all traffic to the attacker's network interface.

Detonation:
- The route table is already manipulated by Terraform. This simulates an attacker intercepting traffic by redirecting it to their own instance.
`,
		Detection: `
- Monitor for changes to VPC route tables, especially routes for 0.0.0.0/0 pointing to unexpected network interfaces.
- Use AWS Config or CloudTrail to alert on route table modifications.
`,
		PrerequisitesTerraformCode: tf,
		Detonate:                   detonate,
		Revert:                     revert,
	})
}

func detonate(params map[string]string, providers stratus.CloudProviders) error {
	routeTableId := params["route_table_id"]
	attackerInstanceId := params["attacker_instance_id"]
	log.Println("[Stratus] Simulating VPC route table manipulation (Man-in-the-Middle attack)")
	log.Printf("[Stratus] Route table %s is configured to send 0.0.0.0/0 traffic to the attacker's instance: %s\n", routeTableId, attackerInstanceId)
	log.Println("[Stratus] This simulates an attacker intercepting traffic in the VPC.")
	return nil
}

func revert(params map[string]string, providers stratus.CloudProviders) error {
	routeTableId := params["route_table_id"]
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		return err
	}
	ec2Client := ec2.NewFromConfig(cfg)
	log.Printf("[Stratus] Attempting to delete the malicious route (0.0.0.0/0) from route table %s...\n", routeTableId)
	_, err = ec2Client.DeleteRoute(context.Background(), &ec2.DeleteRouteInput{
		RouteTableId:         aws.String(routeTableId),
		DestinationCidrBlock: aws.String("0.0.0.0/0"),
	})
	if err != nil {
		log.Printf("[Stratus] Error deleting route: %v\n", err)
		return err
	}
	log.Printf("[Stratus] Successfully deleted the malicious route from route table %s.\n", routeTableId)
	return nil
}
