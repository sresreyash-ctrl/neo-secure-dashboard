import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import APIKey from "./APIKey";
import Report from "./Report";
import Support from "./Support";
import Settings from "./Settings";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();

  const renderPage = () => {
    switch (location.pathname) {
      case "/api-key":
        return <APIKey />;
      case "/report":
        return <Report />;
      case "/support":
        return <Support />;
      case "/settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {renderPage()}
    </div>
  );
};

export default Index;
