package aws

import (
	"context"
	_ "embed"
	"errors"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/cloudtrail"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus"
	"github.com/datadog/stratus-red-team/v2/pkg/stratus/mitreattack"
)

//go:embed main.tf
var tf []byte

func init() {
	stratus.GetRegistry().RegisterAttackTechnique(&stratus.AttackTechnique{
		ID:                 "aws.defense-evasion.cloudtrail-stop",
		FriendlyName:       "Stop CloudTrail Trail",
		Platform:           stratus.AWS,
		MitreAttackTactics: []mitreattack.Tactic{mitreattack.DefenseEvasion},
		FrameworkMappings: []stratus.FrameworkMappings{
			{
				Framework: stratus.ThreatTechniqueCatalogAWS,
				Techniques: []stratus.TechniqueMapping{
					{
						Name: "Impair Defenses: Disable Cloud Logs",
						ID:   "T1562.008",
						URL:  "https://aws-samples.github.io/threat-technique-catalog-for-aws/Techniques/T1562.008.html",
					},
				},
			},
		},
		Description: `
Stops a CloudTrail Trail from logging. Simulates an attacker disrupting CloudTrail logging.

Warm-up: 

- Create a CloudTrail Trail.

Detonation: 

- Call cloudtrail:StopLogging to stop CloudTrail logging.
`,
		Detection: `
Identify when a CloudTrail trail is disabled, through CloudTrail's <code>StopLogging</code> event.

GuardDuty also provides a dedicated finding type, [Stealth:IAMUser/CloudTrailLoggingDisabled](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html#stealth-iam-cloudtrailloggingdisabled).
`,
		PrerequisitesTerraformCode: tf,
		IsIdempotent:               true, // cloudtrail:StopLogging is idempotent
		Detonate:                   detonate,
		Revert:                     revert,
	})
}

func detonate(params map[string]string, providers stratus.CloudProviders) error {
	log.Println("[Detonate] Starting detonation for aws.defense-evasion.cloudtrail-stop technique")

	log.Println("[Detonate] Extracting cloudtrail_trail_name parameter from input params")
	trailName := params["cloudtrail_trail_name"]

	if trailName == "" {
		log.Println("[Detonate][Error] cloudtrail_trail_name parameter is missing")
		return errors.New("cloudtrail_trail_name parameter is required")
	}
	log.Println("[Detonate] cloudtrail_trail_name parameter found:", trailName)

	log.Println("[Detonate] Creating CloudTrail client from AWS provider connection")
	cloudtrailClient := cloudtrail.NewFromConfig(providers.AWS().GetConnection())
	if cloudtrailClient == nil {
		log.Println("[Detonate][Error] Failed to create CloudTrail client")
		return errors.New("failed to create CloudTrail client")
	}
	log.Println("[Detonate] CloudTrail client created successfully")

	log.Println("[Detonate] Preparing StopLoggingInput for API call")
	input := &cloudtrail.StopLoggingInput{
		Name: &trailName,
	}
	log.Printf("[Detonate] StopLoggingInput prepared: %+v\n", input)

	log.Println("[Detonate] Calling cloudtrail:StopLogging API for trail:", trailName)
	_, err := cloudtrailClient.StopLogging(context.Background(), input)

	if err != nil {
		log.Println("[Detonate][Error] Unable to stop CloudTrail logging:", err)
		return errors.New("unable to stop CloudTrail logging: " + err.Error())
	}

	log.Println("[Detonate] Successfully stopped CloudTrail logging for trail:", trailName)
	return nil
}

func revert(params map[string]string, providers stratus.CloudProviders) error {
	log.Println("[Revert] Starting revert for aws.defense-evasion.cloudtrail-stop technique")

	log.Println("[Revert] Extracting cloudtrail_trail_name parameter from input params")
	trailName := params["cloudtrail_trail_name"]

	if trailName == "" {
		log.Println("[Revert][Error] cloudtrail_trail_name parameter is missing")
		return errors.New("cloudtrail_trail_name parameter is required")
	}
	log.Println("[Revert] cloudtrail_trail_name parameter found:", trailName)

	log.Println("[Revert] Creating CloudTrail client from AWS provider connection")
	cloudtrailClient := cloudtrail.NewFromConfig(providers.AWS().GetConnection())
	if cloudtrailClient == nil {
		log.Println("[Revert][Error] Failed to create CloudTrail client")
		return errors.New("failed to create CloudTrail client")
	}
	log.Println("[Revert] CloudTrail client created successfully")

	log.Println("[Revert] Preparing StartLoggingInput for API call")
	input := &cloudtrail.StartLoggingInput{
		Name: &trailName,
	}
	log.Printf("[Revert] StartLoggingInput prepared: %+v\n", input)

	log.Println("[Revert] Calling cloudtrail:StartLogging API for trail:", trailName)
	_, err := cloudtrailClient.StartLogging(context.Background(), input)

	if err != nil {
		log.Println("[Revert][Error] Unable to restart CloudTrail logging:", err)
		return err
	}

	log.Println("[Revert] Successfully restarted CloudTrail logging for trail:", trailName)
	return nil
}
