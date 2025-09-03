import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BackButton from "@/components/BackButton";

const Settings = () => {
  const [awsConfig, setAwsConfig] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    s3BucketName: ""
  });

  const handleAwsConfigChange = (field: string, value: string) => {
    setAwsConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAwsConfig = () => {
    // Store AWS configuration in localStorage
    localStorage.setItem('awsConfig', JSON.stringify(awsConfig));
    console.log("AWS Configuration saved:", awsConfig);
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-4xl">
        <BackButton />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your AWS credentials and API settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="aws-config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aws-config">AWS Configuration</TabsTrigger>
            <TabsTrigger value="add-user">Add User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="aws-config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">☁</span>
                  </div>
                  AWS Credentials
                </CardTitle>
                <CardDescription>
                  Configure your AWS credentials for S3 uploads and data management.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="access-key-id">Access Key ID</Label>
                  <Input
                    id="access-key-id"
                    type="text"
                    placeholder="Enter your AWS Access Key ID"
                    value={awsConfig.accessKeyId}
                    onChange={(e) => handleAwsConfigChange('accessKeyId', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="secret-access-key">Secret Access Key</Label>
                  <Input
                    id="secret-access-key"
                    type="password"
                    placeholder="Enter your AWS Secret Access Key"
                    value={awsConfig.secretAccessKey}
                    onChange={(e) => handleAwsConfigChange('secretAccessKey', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={awsConfig.region} 
                    onValueChange={(value) => handleAwsConfigChange('region', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">us-east-1</SelectItem>
                      <SelectItem value="us-east-2">us-east-2</SelectItem>
                      <SelectItem value="us-west-1">us-west-1</SelectItem>
                      <SelectItem value="us-west-2">us-west-2</SelectItem>
                      <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                      <SelectItem value="eu-west-2">eu-west-2</SelectItem>
                      <SelectItem value="eu-central-1">eu-central-1</SelectItem>
                      <SelectItem value="ap-southeast-1">ap-southeast-1</SelectItem>
                      <SelectItem value="ap-southeast-2">ap-southeast-2</SelectItem>
                      <SelectItem value="ap-northeast-1">ap-northeast-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="s3-bucket-name">S3 Bucket Name</Label>
                  <Input
                    id="s3-bucket-name"
                    type="text"
                    placeholder="Enter your S3 bucket name"
                    value={awsConfig.s3BucketName}
                    onChange={(e) => handleAwsConfigChange('s3BucketName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleSaveAwsConfig}
                  className="w-full mt-6"
                >
                  Save AWS Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add-user" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add User</CardTitle>
                <CardDescription>
                  User management functionality will be available soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This feature is coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;