import { Download, Activity, Settings } from "lucide-react";
import DashboardCard from "./DashboardCard";
import ExpandableAttackCard from "./ExpandableAttackCard";

const Dashboard = () => {
  const handleDownloadReport = () => {
    console.log("Download Report clicked");
  };

  const handleResetConfiguration = () => {
    console.log("Reset clicked");
  };

  // Mock recent activity
  const recentActivity = [
    { id: 1, action: "AWS Credential Access Attack", status: "Completed", time: "2 hours ago", result: "Success" },
    { id: 2, action: "S3 Bucket Policy Analysis", status: "Completed", time: "1 day ago", result: "Success" },
    { id: 3, action: "IAM Role Backdoor Test", status: "Failed", time: "3 days ago", result: "Blocked" },
    { id: 4, action: "CloudTrail Log Analysis", status: "Completed", time: "1 week ago", result: "Success" },
  ];

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Cloud Attack Simulation Platform
              </h1>
              <p className="text-muted-foreground text-lg">
                Advanced security testing and vulnerability assessment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                System Online
              </div>
            </div>
          </div>
        </div>



        {/* Run Attack Section */}
        <div className="mb-8">
          <ExpandableAttackCard />
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.result === 'Success' ? 'bg-green-500' : 
                    activity.result === 'Blocked' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.result === 'Success' ? 'bg-green-100 text-green-700' :
                        activity.result === 'Blocked' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {activity.result}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download Report Section */}
        <div className="mt-8 mb-8">
          <DashboardCard
            title="Download Report"
            description="Generate and download comprehensive PDF reports of your security assessments."
            buttonText="Download Report"
            icon={Download}
            onButtonClick={handleDownloadReport}
          />
        </div>

        {/* Reset Configuration Button */}
        <div className="flex justify-center">
          <button
            onClick={handleResetConfiguration}
            className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg font-medium hover:bg-destructive-hover transition-colors flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Reset Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;