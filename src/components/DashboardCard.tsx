import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  onButtonClick: () => void;
}

const DashboardCard = ({ 
  title, 
  description, 
  buttonText, 
  icon: Icon, 
  onButtonClick 
}: DashboardCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card hover:shadow-hover transition-shadow">
      <div className="flex items-start gap-4">
        <div className="text-primary">
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {description}
          </p>
          <button
            onClick={onButtonClick}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;