import { Link } from "react-router-dom";

const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded mr-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-600">neo_security</h1>
            </div>
            <p className="text-gray-500 text-sm mb-6">DATA SECURITY POSTURE MANAGEMENT</p>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Sign up</h2>
            <p className="text-gray-600">
              Please reach out to the administrator for assistance with account creation.
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              ← Back to Login
            </Link>
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

export default SignUp;