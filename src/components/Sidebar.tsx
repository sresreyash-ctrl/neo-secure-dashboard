import { Home, FileText, HelpCircle, Key, Settings, LogOut } from "lucide-react";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className = "" }: SidebarProps) => {
  const menuItems = [
    { icon: Home, label: "Home", active: true },
    { icon: FileText, label: "Report" },
    { icon: HelpCircle, label: "Support" },
    { icon: Key, label: "Set OpenAI API Key" },
    { icon: Settings, label: "Settings" },
  ];

  const handleMenuItemClick = (label: string) => {
    console.log(`${label} clicked`);
  };

  const handleLogoutClick = () => {
    console.log("Logout clicked");
  };

  return (
    <div className={`bg-sidebar text-sidebar-foreground flex flex-col h-screen w-64 ${className}`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">N</span>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide">neo_security</div>
            <div className="text-xs opacity-75">DATA SECURITY POSTURE MANAGEMENT</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleMenuItemClick(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    item.active 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive-hover transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;