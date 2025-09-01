import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="mb-4 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft size={16} className="mr-2" />
      Back
    </Button>
  );
};

export default BackButton;