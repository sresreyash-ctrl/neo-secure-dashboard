import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const Settings = () => {
  const { toast } = useToast();
  const [awsConfig, setAwsConfig] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: ""
  });

  const [curlCommand, setCurlCommand] = useState("");

  const handleAwsConfigChange = (field: string, value: string) => {
    setAwsConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAwsConfig = async () => {
  try {
    const response = await axios.post("http://localhost:8000/save-aws-config", awsConfig);

    if (response.status === 200) {
      console.log("AWS Configuration saved to backend .env");
      toast({
        title: "Success!",
        description: "AWS configuration saved successfully!",
      });
    }
  } catch (err: any) {
    console.error("Error saving AWS config:", err);
    toast({
      title: "Error",
      description: "Failed to save AWS config: " + (err.response?.data?.error || err.message),
      variant: "destructive",
    });
  }
  };

  const handleSaveProduct = async () => {
    try {
      // Defer POST. Store cURL locally to be sent after attack completes.
      if (curlCommand && curlCommand.trim().length > 0) {
        localStorage.setItem("deferredProductCurl", curlCommand.trim());
      }

      toast({
        title: "Success!",
        description: "Product onboarded successfully!",
      });
    } catch (err: any) {
      console.error("Error saving product cURL:", err);
      toast({
        title: "Error",
        description: "Failed to save product details: " + (err.response?.data?.error || err.message),
        variant: "destructive",
      });
    }
    setCurlCommand("");
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
            <TabsTrigger value="onboard-product">Onboard Product</TabsTrigger>
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
                  <Input
                    id="region"
                    type="text"
                    placeholder="Enter your AWS region (e.g., us-east-1)"
                    value={awsConfig.region}
                    onChange={(e) => handleAwsConfigChange('region', e.target.value)}
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
          
          <TabsContent value="onboard-product" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboard Product</CardTitle>
                <CardDescription>
                  Paste a cURL command to onboard a new product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="curl-command">cURL Command</Label>
                  <Input
                    id="curl-command"
                    type="text"
                    placeholder="Paste your cURL command here..."
                    value={curlCommand}
                    onChange={(e) => setCurlCommand(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={handleSaveProduct}
                  className="w-full mt-6"
                >
                  Save
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;