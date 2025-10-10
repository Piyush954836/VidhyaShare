import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGoogle,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, login, socialLogin } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate("/dashboard");
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <Navbar />
      <div className="flex justify-center items-center py-16 px-4 flex-1">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition duration-500 hover:scale-[1.02]">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-center text-gray-800 dark:text-white">
            Welcome Back 👋
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Please login to continue
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="pl-10 border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="pl-10 pr-10 border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 hover:text-indigo-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={formLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-md transition duration-300"
            >
              {formLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
            <span className="mx-3 text-gray-500 dark:text-gray-400">or</span>
            <hr className="flex-1 border-gray-300 dark:border-gray-600" />
          </div>

          {/* Social Login (Unified BG) */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => socialLogin("google")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-md transition"
            >
              <FaGoogle className="text-yellow-300 bg-white rounded-full p-1" /> 
              Continue with Google
            </Button>
            <Button
              onClick={() => socialLogin("github")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-md transition"
            >
              <FaGithub className="text-white" /> Continue with GitHub
            </Button>
            <Button
              onClick={() => socialLogin("linkedin_oidc")}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-lg shadow-md transition"
            >
              <FaLinkedin className="text-blue-300 bg-white rounded-full p-1" /> 
              Continue with LinkedIn
            </Button>
          </div>

          {/* Register link */}
          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
