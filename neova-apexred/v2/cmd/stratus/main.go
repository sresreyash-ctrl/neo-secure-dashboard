package main

import (
	"log"
	"os"

	_ "github.com/datadog/stratus-red-team/v2/internal/attacktechniques"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use: "neova-apexred",
}

var awsDebug bool

func init() {
	setupLogging()

	listCmd := buildListCmd()
	showCmd := buildShowCmd()
	warmupCmd := buildWarmupCmd()
	detonateCmd := buildDetonateCmd()
	revertCmd := buildRevertCmd()
	statusCmd := buildStatusCmd()
	cleanupCmd := buildCleanupCmd()
	versionCmd := buildVersionCmd()

	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(showCmd)
	rootCmd.AddCommand(warmupCmd)
	rootCmd.AddCommand(detonateCmd)
	rootCmd.AddCommand(revertCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(cleanupCmd)
	rootCmd.AddCommand(versionCmd)

	rootCmd.PersistentFlags().BoolVar(&awsDebug, "aws-debug", false, "Enable verbose AWS SDK request/response logging")
}

func setupLogging() {
	log.SetOutput(os.Stdout)
}

func main() {
	cobra.OnInitialize(func() {
		if awsDebug {
			os.Setenv("STRATUS_AWS_DEBUG", "1")
		}
	})
	rootCmd.Execute()
}
