"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, Stethoscope, Heart, Activity } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { API_ENDPOINTS } from "../../common/common";

export default function DoctorAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setError("");

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      email_address: email,
      password: password
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect
    };

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, requestOptions);
      const result = await response.json();
      
      if (response.ok && result.access_token) {
        // Store tokens in Redux
        dispatch(setCredentials({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          user: result.user,
        }));
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orbs */}
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>

        {/* Secondary floating elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-teal-100/20 to-green-100/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-emerald-100/25 to-blue-100/25 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '4s', animationDuration: '8s' }}></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
      </div>

      {/* Enhanced Floating Medical Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-16 left-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-10' : 'opacity-0'}`}>
          <Heart className="h-6 w-6 text-emerald-500 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className={`absolute top-32 right-20 transition-all duration-1000 delay-500 ${mounted ? 'opacity-8' : 'opacity-0'}`}>
          <Activity className="h-5 w-5 text-teal-500 animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        <div className={`absolute bottom-24 left-20 transition-all duration-1000 delay-700 ${mounted ? 'opacity-10' : 'opacity-0'}`}>
          <Stethoscope className="h-6 w-6 text-green-500 animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
        <div className={`absolute top-1/2 right-12 transition-all duration-1000 delay-900 ${mounted ? 'opacity-6' : 'opacity-0'}`}>
          <Shield className="h-4 w-4 text-blue-500 animate-pulse" style={{ animationDelay: '5s' }} />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className={`w-full max-w-md transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
          {/* Compact Header Section */}
          <div className="text-center mb-6">
            {/* Logo/Icon Container */}
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-md opacity-30 animate-pulse"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-lg border border-emerald-100 transform hover:scale-105 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <img
                  src="/mediconnect-logo.svg"
                  alt="MediConnect Logo"
                  className="h-10 w-10 relative z-10"
                />
              </div>
            </div>

            {/* Compact Title */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text text-transparent mb-2 tracking-tight">
              MediConnect
            </h1>
            <p className="text-lg text-gray-700 font-medium mb-1">Medical Appointment System</p>
            <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
              Secure healthcare portal for professionals
            </p>

            {/* Status indicator */}
            <div className="inline-flex items-center mt-3 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5"></div>
              <span className="text-xs font-medium text-emerald-700">Online</span>
            </div>
          </div>

          {/* Compact Login Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden transform hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-center">
              <h2 className="text-white text-lg font-semibold">Secure Login</h2>
              <p className="text-emerald-100 text-sm">Enter your credentials</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Enhanced Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-start space-x-3 animate-fadeIn shadow-sm">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-red-500 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <p className="font-medium">Login Failed</p>
                      <p className="text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Compact Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-emerald-600" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-gray-50/50 hover:bg-white text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="your.email@hospital.com"
                    />
                  </div>
                </div>

                {/* Compact Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-emerald-600" />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200 bg-gray-50/50 hover:bg-white text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500 hover:text-emerald-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500 hover:text-emerald-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Compact Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-600 hover:via-teal-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] group"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Compact Footer */}
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Secure & HIPAA Compliant</span>
                </div>
                <p className="text-xs text-gray-500">
                  Enterprise-grade security for healthcare data
                </p>
              </div>
            </div>
          </div>

          {/* Compact Footer Text */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
              <img
                src="/mediconnect-logo.svg"
                alt="MediConnect"
                className="h-3 w-3"
              />
              <span className="text-xs text-gray-600 font-medium">MediConnect</span>
              <span className="text-xs text-gray-400">v2.0</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 MediConnect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}