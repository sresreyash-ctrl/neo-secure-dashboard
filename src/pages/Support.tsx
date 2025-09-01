import { Mail, MessageCircle, Book, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Support = () => {
  const handleContactSupport = () => {
    console.log("Opening support contact...");
  };

  const handleOpenDocs = () => {
    console.log("Opening documentation...");
  };

  const handleOpenCommunity = () => {
    console.log("Opening community forum...");
  };

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Support Center
          </h1>
          <p className="text-muted-foreground">
            Get help with NEO_SECURITY and cloud attack simulations
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-card hover:shadow-hover transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-primary">
                <Mail size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Email Support
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get personalized help from our security experts within 24 hours.
                </p>
                <Button
                  onClick={handleContactSupport}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card hover:shadow-hover transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-primary">
                <Book size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Documentation
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Browse our comprehensive guides and API reference.
                </p>
                <Button
                  onClick={handleOpenDocs}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  View Docs
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card hover:shadow-hover transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-primary">
                <MessageCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Community Forum
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect with other users and share best practices.
                </p>
                <Button
                  onClick={handleOpenCommunity}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Join Community
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="text-muted-foreground">
                <Book size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  Knowledge Base
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Find answers to frequently asked questions and troubleshooting guides.
                </p>
                <div className="text-sm text-muted-foreground">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-card">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-card-foreground mb-1">
                How do I start my first attack simulation?
              </h4>
              <p className="text-sm text-muted-foreground">
                Navigate to the Home page and click "Run Attack" to begin your cloud security assessment.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-1">
                What cloud providers are supported?
              </h4>
              <p className="text-sm text-muted-foreground">
                Currently, NEO_SECURITY supports AWS, Azure, and Google Cloud Platform environments.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-card-foreground mb-1">
                How can I export my compliance reports?
              </h4>
              <p className="text-sm text-muted-foreground">
                Visit the Report page and click "Export Report" to download a PDF version of your security assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;