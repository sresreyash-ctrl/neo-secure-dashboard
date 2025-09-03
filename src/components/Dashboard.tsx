import { Download } from "lucide-react";
import DashboardCard from "./DashboardCard";
import ExpandableAttackCard from "./ExpandableAttackCard";

const Dashboard = () => {
  const handleDownloadReport = () => {
    console.log("Download Report clicked");
  };

  const handleResetConfiguration = () => {
    console.log("Reset clicked");
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Cloud Attack Simulation Platform
          </h1>
          <p className="text-muted-foreground">
            Follow the workflow from left to right, top to bottom
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ExpandableAttackCard />
          <DashboardCard
            title="Download Report"
            description="Download a full PDF report of scan results."
            buttonText="Download Report"
            icon={Download}
            onButtonClick={handleDownloadReport}
          />
        </div>

        {/* Reset Configuration Button */}
        <div className="flex justify-center">
          <button
            onClick={handleResetConfiguration}
            className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg font-medium hover:bg-destructive-hover transition-colors"
          >
            Reset Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;