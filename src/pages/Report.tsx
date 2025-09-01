import { CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";

const Report = () => {
  const handleExportReport = () => {
    console.log("Exporting report...");
  };

  const complianceResults = [
    {
      id: "CIS-1.1",
      title: "Ensure MFA is enabled for root account",
      subtitle: "AWS Root Account",
      severity: "high",
      status: "passed"
    },
    {
      id: "CIS-1.2", 
      title: "Ensure security contact information is provided",
      subtitle: "AWS Account Settings",
      severity: "medium",
      status: "failed"
    },
    {
      id: "CIS-2.1",
      title: "Ensure CloudTrail is enabled in all regions", 
      subtitle: "AWS CloudTrail",
      severity: "high",
      status: "warning"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "failed":
        return <XCircle className="text-red-600" size={20} />;
      case "warning":
        return <AlertTriangle className="text-yellow-600" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "passed":
        return "passed";
      case "failed":
        return "failed";
      case "warning":
        return "warning";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-6xl">
        <BackButton />
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Compliance Report
            </h1>
            <p className="text-muted-foreground">
              Review your security posture analysis results
            </p>
          </div>
          <Button
            onClick={handleExportReport}
            className="bg-primary text-primary-foreground hover:bg-primary-hover flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={32} />
              <div>
                <div className="text-2xl font-bold text-card-foreground">12</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" size={32} />
              <div>
                <div className="text-2xl font-bold text-card-foreground">5</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-600" size={32} />
              <div>
                <div className="text-2xl font-bold text-card-foreground">3</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Results */}
        <div className="bg-card border border-border rounded-lg shadow-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">
              Compliance Results
            </h2>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of security controls assessment
            </p>
          </div>

          <div className="divide-y divide-border">
            {complianceResults.map((result) => (
              <div key={result.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium text-card-foreground mb-1">
                      {result.id}
                    </div>
                    <div className="text-sm text-card-foreground mb-1">
                      {result.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(result.severity)}`}>
                    {result.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(result.status)}`}>
                    {getStatusText(result.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;