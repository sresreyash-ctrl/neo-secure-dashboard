import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const APIKey = () => {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim());
      console.log("API key saved to localStorage");
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    console.log("API key cleared from localStorage");
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Set OpenAI API Key
          </h1>
          <p className="text-muted-foreground">
            Enter your OpenAI API key to enable AI features. You can find your key in your OpenAI account{" "}
            <span className="text-primary cursor-pointer hover:underline">
              dashboard
            </span>
            .
          </p>
        </div>

        {/* API Key Form */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-card">
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key" className="text-sm font-medium text-card-foreground">
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="mt-2"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                onClick={handleSaveKey}
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                Save Key
              </Button>
              <Button
                variant="outline"
                onClick={handleClearKey}
              >
                Clear Key
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKey;