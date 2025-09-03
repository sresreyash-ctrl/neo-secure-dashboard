import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export interface AttackTechnique {
  id: string;
  name: string;
  platform: string;
  tactic: string;
}

const attackTechniques: AttackTechnique[] = [
  { id: "aws.credential-access.ec2-get-password-data", name: "Retrieve EC2 Password Data", platform: "AWS", tactic: "Credential Access" },
  { id: "aws.credential-access.ec2-steal-instance-credentials", name: "Steal EC2 Instance Credentials", platform: "AWS", tactic: "Credential Access" },
  { id: "aws.credential-access.secretsmanager-batch-retrieve-secrets", name: "Retrieve a High Number of Secrets Manager secrets (Batch)", platform: "AWS", tactic: "Credential Access" },
  { id: "aws.credential-access.secretsmanager-retrieve-secrets", name: "Retrieve a High Number of Secrets Manager secrets", platform: "AWS", tactic: "Credential Access" },
  { id: "aws.credential-access.ssm-retrieve-securestring-parameters", name: "Retrieve And Decrypt SSM Parameters", platform: "AWS", tactic: "Credential Access" },
  { id: "aws.defense-evasion.cloudtrail-delete", name: "Delete CloudTrail Trail", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.cloudtrail-event-selectors", name: "Disable CloudTrail Logging Through Event Selectors", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.cloudtrail-lifecycle-rule", name: "CloudTrail Logs Impairment Through S3 Lifecycle Rule", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.cloudtrail-stop", name: "Stop CloudTrail Trail", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.dns-delete-logs", name: "Delete DNS query logs", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.organizations-leave", name: "Attempt to Leave the AWS Organization", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.unused-region-resource", name: "Create Resource in an Unused AWS Region", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.vpc-remove-flow-logs", name: "Remove VPC Flow Logs", platform: "AWS", tactic: "Defense Evasion" },
  { id: "aws.defense-evasion.vpc-route-table-mitm", name: "VPC Route Table Manipulation (Man-in-the-Middle)", platform: "AWS", tactic: "Credential Access / Defense Evasion" },
  { id: "aws.discovery.ec2-enumerate-from-instance", name: "Execute Discovery Commands on an EC2 Instance", platform: "AWS", tactic: "Discovery" },
  { id: "aws.discovery.ec2-download-user-data", name: "Download EC2 Instance User Data", platform: "AWS", tactic: "Discovery" },
  { id: "aws.discovery.ses-enumerate", name: "Enumerate SES", platform: "AWS", tactic: "Discovery" },
  { id: "aws.execution.ec2-launch-unusual-instances", name: "Launch Unusual EC2 instances", platform: "AWS", tactic: "Execution" },
  { id: "aws.execution.ec2-user-data", name: "Execute Commands on EC2 Instance via User Data", platform: "AWS", tactic: "Execution / Privilege Escalation" },
  { id: "aws.execution.ssm-send-command", name: "Usage of ssm:SendCommand on multiple instances", platform: "AWS", tactic: "Execution" },
  { id: "aws.execution.ssm-start-session", name: "Usage of ssm:StartSession on multiple instances", platform: "AWS", tactic: "Execution" },
  { id: "aws.exfiltration.ec2-security-group-open-port-22-ingress", name: "Open Ingress Port 22 on a Security Group", platform: "AWS", tactic: "Exfiltration" },
  { id: "aws.exfiltration.ec2-share-ami", name: "Exfiltrate an AMI by Sharing It", platform: "AWS", tactic: "Exfiltration" },
  { id: "aws.exfiltration.ec2-share-ebs-snapshot", name: "Exfiltrate EBS Snapshot by Sharing It", platform: "AWS", tactic: "Exfiltration" },
  { id: "aws.exfiltration.rds-share-snapshot", name: "Exfiltrate RDS Snapshot by Sharing", platform: "AWS", tactic: "Exfiltration" },
  { id: "aws.exfiltration.s3-backdoor-bucket-policy", name: "Backdoor an S3 Bucket via its Bucket Policy", platform: "AWS", tactic: "Exfiltration" },
  { id: "aws.impact.bedrock-invoke-model", name: "Invoke Bedrock Model", platform: "AWS", tactic: "Impact" },
  { id: "aws.impact.s3-ransomware-batch-deletion", name: "S3 Ransomware through batch file deletion", platform: "AWS", tactic: "Impact" },
  { id: "aws.impact.s3-ransomware-client-side-encryption", name: "S3 Ransomware through client-side encryption", platform: "AWS", tactic: "Impact" },
  { id: "aws.impact.s3-ransomware-individual-deletion", name: "S3 Ransomware through individual file deletion", platform: "AWS", tactic: "Impact" },
  { id: "aws.initial-access.console-login-without-mfa", name: "Console Login without MFA", platform: "AWS", tactic: "Initial Access" },
  { id: "aws.lateral-movement.ec2-serial-console-send-ssh-public-key", name: "Usage of EC2 Serial Console to push SSH public key", platform: "AWS", tactic: "Lateral Movement" },
  { id: "aws.lateral-movement.ec2-instance-connect", name: "Usage of EC2 Instance Connect on multiple instances", platform: "AWS", tactic: "Lateral Movement" },
  { id: "aws.persistence.iam-backdoor-role", name: "Backdoor an IAM Role", platform: "AWS", tactic: "Persistence" },
  { id: "aws.persistence.iam-backdoor-user", name: "Create an Access Key on an IAM User", platform: "AWS", tactic: "Persistence / Privilege Escalation" },
  { id: "aws.persistence.iam-create-admin-user", name: "Create an administrative IAM User", platform: "AWS", tactic: "Persistence / Privilege Escalation" },
  { id: "aws.persistence.iam-create-backdoor-role", name: "Create a backdoored IAM Role", platform: "AWS", tactic: "Persistence" },
  { id: "aws.persistence.iam-create-user-login-profile", name: "Create a Login Profile on an IAM User", platform: "AWS", tactic: "Persistence / Privilege Escalation" },
  { id: "aws.persistence.lambda-backdoor-function", name: "Backdoor Lambda Function Through Resource-Based Policy", platform: "AWS", tactic: "Persistence" },
  { id: "aws.persistence.lambda-layer-extension", name: "Add a Malicious Lambda Extension", platform: "AWS", tactic: "Persistence / Privilege Escalation" },
  { id: "aws.persistence.lambda-overwrite-code", name: "Overwrite Lambda Function Code", platform: "AWS", tactic: "Persistence" },
  { id: "aws.persistence.rolesanywhere-create-trust-anchor", name: "Create an IAM Roles Anywhere trust anchor", platform: "AWS", tactic: "Persistence / Privilege Escalation" },
  { id: "aws.persistence.sts-federation-token", name: "Generate temporary AWS credentials using GetFederationToken", platform: "AWS", tactic: "Persistence" },
  { id: "aws.privilege-escalation.iam-update-user-login-profile", name: "Change IAM user password", platform: "AWS", tactic: "Privilege Escalation" },
];

interface AttackTechniquesTableProps {
  selectedTechnique: string | null;
  onSelectionChange: (selectedId: string | null) => void;
}

const AttackTechniquesTable = ({ selectedTechnique, onSelectionChange }: AttackTechniquesTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTechniques = useMemo(() => {
    if (!searchTerm) return attackTechniques;
    
    const term = searchTerm.toLowerCase();
    return attackTechniques.filter(technique => 
      technique.id.toLowerCase().includes(term) ||
      technique.name.toLowerCase().includes(term) ||
      technique.platform.toLowerCase().includes(term) ||
      technique.tactic.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleTechniqueSelect = (techniqueId: string) => {
    onSelectionChange(selectedTechnique === techniqueId ? null : techniqueId);
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search by ID, Name, Platform, or Tactic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
      </div>

      {/* Selection Status */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {selectedTechnique ? "1 technique selected" : "No technique selected"}
        </span>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
                         <thead className="bg-muted sticky top-0">
               <tr>
                 <th className="text-left p-3 font-medium text-muted-foreground w-12"></th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Technique ID</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Technique Name</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Platform</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">MITRE ATT&CK Tactic</th>
               </tr>
             </thead>
            <tbody>
              {filteredTechniques.map((technique) => (
                <tr key={technique.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3">
                    <input
                      type="radio"
                      name="attack-technique"
                      checked={selectedTechnique === technique.id}
                      onChange={() => handleTechniqueSelect(technique.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="p-3 font-mono text-sm text-foreground">{technique.id}</td>
                  <td className="p-3 text-sm text-foreground">{technique.name}</td>
                  <td className="p-3 text-sm text-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {technique.platform}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-foreground">{technique.tactic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTechniques.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No attack techniques found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackTechniquesTable;