import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [scanFrequency, setScanFrequency] = useState("weekly");

  const handleSaveSettings = () => {
    console.log("Settings saved:", {
      emailNotifications,
      autoExport,
      scanFrequency,
    });
  };

  const handleResetSettings = () => {
    setEmailNotifications(true);
    setAutoExport(false);
    setScanFrequency("weekly");
    console.log("Settings reset to defaults");
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your NEO_SECURITY preferences and notification settings
          </p>
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive email alerts when scans complete or issues are found
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-export" className="text-sm font-medium">
                  Auto-export Reports
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically generate PDF reports after each scan
                </p>
              </div>
              <Switch
                id="auto-export"
                checked={autoExport}
                onCheckedChange={setAutoExport}
              />
            </div>
          </div>
        </div>

        {/* Scan Settings */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Scan Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scan-frequency" className="text-sm font-medium">
                Automatic Scan Frequency
              </Label>
              <Select value={scanFrequency} onValueChange={setScanFrequency}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How often should NEO_SECURITY automatically run security scans
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-card mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Account
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Account Type</Label>
              <p className="text-sm text-muted-foreground mt-1">Professional</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Subscription Status</Label>
              <p className="text-sm text-muted-foreground mt-1">Active</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleSaveSettings}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;