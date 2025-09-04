import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/BackButton";

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
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    // Save to backend .env
    fetch("http://127.0.0.1:8000/save-openai-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: trimmed }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save key");
        }
        return res.json();
      })
      .then(() => {
        localStorage.setItem("openai_api_key", trimmed);
        console.log("API key saved to backend and localStorage");
        toast({ title: "OpenAI API Key saved!", description: "Your key has been stored securely." });
        setApiKey("");
      })
      .catch((err) => {
        console.error("Error saving OpenAI key:", err);
        toast({ title: "Failed to save OpenAI API Key", description: String(err), variant: "destructive" as any });
      });
  };

  const handleClearKey = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    console.log("API key cleared from localStorage");
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-2xl">
        <BackButton />
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