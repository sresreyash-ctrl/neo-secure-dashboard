import { useState } from "react";
import { Play, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import AttackTechniquesTable from "./AttackTechniquesTable";
import { useToast } from "@/hooks/use-toast";

type AttackStatus = 'idle' | 'running' | 'success' | 'failed';

const ExpandableAttackCard = () => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [attackStatus, setAttackStatus] = useState<AttackStatus>('idle');

  const handleCardClick = () => {
    if (attackStatus === 'idle') {
      setIsExpanded(!isExpanded);
    }
  };

  const handleRunAttack = async () => {
  if (!selectedTechnique) return;

  setAttackStatus("running");
  try {
    const response = await fetch("http://localhost:8000/attack/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technique_id: selectedTechnique }),
    });

    if (!response.ok) {
      throw new Error("Failed to run attack");
    }

    const data = await response.json();
    console.log("Attack response:", data);
    setAttackStatus("success"); // or check backend logs for failure

    // Immediately fetch CloudTrail logs after attack completes (before cleanup)
    try {
      const cloudtrailResponse = await fetch("http://localhost:8000/fetch-cloudtrail-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curl: "attack-completed" }),
      });
      if (!cloudtrailResponse.ok) {
        throw new Error("Detection logs fetch failed");
      }
      const cloudtrailData = await cloudtrailResponse.json();
      console.log("Detection logs response:", cloudtrailData);
      toast({ title: "Detection logs fetched", description: "Detection_Logs.json updated." });
    } catch (cloudtrailError) {
      console.error("Error fetching Detection logs:", cloudtrailError);
      toast({ title: "Detection fetch failed", description: String(cloudtrailError), variant: "destructive" });
    }

    // After successful attack, send deferred product POST if available
    const deferredCurl = localStorage.getItem("deferredProductCurl");
    if (deferredCurl) {
      try {
        const postResponse = await fetch("http://localhost:8000/fetch-cloudtrail-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ curl: deferredCurl }),
        });
        if (!postResponse.ok) {
          throw new Error("Deferred product POST failed");
        }
        const postData = await postResponse.json();
        console.log("Deferred product response:", postData);
        toast({ title: "CloudTrail logs fetched", description: "Detection_Logs.json updated." });
        // clear only after success
        localStorage.removeItem("deferredProductCurl");
      } catch (postError) {
        console.error("Error sending deferred product POST:", postError);
        toast({ title: "CloudTrail fetch failed", description: String(postError), variant: "destructive" });
      }
    }
  } catch (error) {
    console.error("Error running attack:", error);
    setAttackStatus("failed");
  } finally {
    // Reset after 5s
    setTimeout(() => {
      setAttackStatus("idle");
      setIsExpanded(false);
      setSelectedTechnique(null);
    }, 5000);
  }
};


  const getStatusDisplay = () => {
    switch (attackStatus) {
      case 'running':
        return (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Attack in Progress...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Attack Completed Successfully</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Attack Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-card hover:shadow-hover transition-shadow">
      {/* Card Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          <div className="text-primary">
            <Play size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Run Attack
              </h3>
              {attackStatus === 'idle' && (
                <div className="text-muted-foreground">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Execute penetration testing and vulnerability assessment.
            </p>
            
            {/* Status Display */}
            {getStatusDisplay()}
            
            {/* Initial Run Attack Button (only when not expanded) */}
            {!isExpanded && attackStatus === 'idle' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors"
              >
                Run Attack
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && attackStatus === 'idle' && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="pt-6 space-y-6">
            <div>
              <h4 className="text-md font-semibold text-card-foreground mb-4">
                Select Attack Technique
              </h4>
              <AttackTechniquesTable
                selectedTechnique={selectedTechnique}
                onSelectionChange={setSelectedTechnique}
              />
            </div>
            
            {/* Run Attack Button */}
            <div className="flex justify-center">
              <button
                onClick={handleRunAttack}
                disabled={!selectedTechnique}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Attack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandableAttackCard;