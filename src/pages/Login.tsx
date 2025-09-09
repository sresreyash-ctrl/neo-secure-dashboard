import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login logic would go here
    console.log("Login attempt:", { userId, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded mr-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-600">neo_security</h1>
            </div>
            <p className="text-gray-500 text-sm mb-4">DATA SECURITY POSTURE MANAGEMENT</p>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to</h2>
            <h3 className="text-lg font-semibold text-gray-600 mb-4">An AI-Powered Cloud Compliance Solution</h3>
            <p className="text-gray-600">Login to begin using neo_security DSPM</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Login
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              Do not have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-gray-600">
              Forgot Password?{" "}
              <Link to="/reset-password" className="text-blue-600 hover:underline">
                Click Here to reset your password
              </Link>
            </p>
            <p className="text-gray-600">
              Interested in using our service?{" "}
              <Link to="/contact-us" className="text-blue-600 hover:underline">
                Contact Us
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-sm">
            COPYRIGHT 2025 © NEOVA TECH SOLUTIONS INC.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;