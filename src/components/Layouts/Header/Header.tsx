"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Clock,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { logout } from "../../Login/authSlice";
import ProfileModal from "../../Profile/Profile";
import ChangePasswordModal from "../../ChangePassword/ChangePassword";
import httpService from "../../../common/utils/httpService";

// Define the Redux state structure
interface RootState {
  auth: {
    user: {
      first_name: string;
      last_name: string;
      email_address: string;
    } | null;
    access_token: string | null;
  };
}

export default function Header() {
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const schedulesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Get user data and access_token from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const access_token = useSelector((state: RootState) => state.auth.access_token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        schedulesRef.current &&
        !schedulesRef.current.contains(event.target as Node)
      ) {
        setIsSchedulesOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Patients", icon: Users, href: "/patients" },
    { name: "Appointments", icon: Calendar, href: "/appointments" },
  ];

  // Get full user name
  const getUserName = () => {
    if (!user) return "User";
    return `${user.first_name} ${user.last_name}`;
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsProfileOpen(false);
  };

  // Handle password change with API integration
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean | string;
    message?: string;
    status?: number | string;
  }> => {
    if (!access_token) {
      throw new Error("Authentication token not found");
    }

    try {
      const response = await httpService.patch(
        "auth/change_password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      console.log("Password changed successfully:", response.data);
      return {
        success: true,
        message: "Password changed successfully",
        status: 200
      };
    } catch (error) {
      console.error("Password change error:", error);
      const err = error as { message?: string; status?: number };
      return {
        success: false,
        message: err.message || "Failed to change password",
        status: err.status || 500
      };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-800 to-green-700 shadow-lg backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <div className="h-6 w-6 rounded-full bg-green-600"></div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              MediCare
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-green-900 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-white hover:bg-green-900/50 rounded-lg transition-all duration-200 group"
                >
                  <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}

            {/* Schedules Dropdown */}
            <div className="relative" ref={schedulesRef}>
              <button
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-green-900/50 rounded-lg transition-all duration-200 group"
                onClick={() => setIsSchedulesOpen(!isSchedulesOpen)}
              >
                <Clock className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Schedules</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isSchedulesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSchedulesOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-green-200 bg-white shadow-xl py-2 z-50">
                  <a
                    href="/schedules"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors rounded-lg mx-2"
                  >
                    <span className="ml-1">Normal</span>
                  </a>
                  <a
                    href="/custom-schedules"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors rounded-lg mx-2"
                  >
                    <span className="ml-1">Custom</span>
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-2 rounded-full p-1 hover:bg-green-900/50 transition-all duration-200"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80"
                  alt="Doctor profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden lg:inline text-white font-medium">
                {getUserName()}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-white transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-green-200 bg-white shadow-xl py-2 z-50">
                <button
                  onClick={() => {
                    setIsChangePasswordOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors rounded-lg mx-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-100 transition-colors rounded-lg mx-2"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <hr className="my-2 border-green-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2"
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gradient-to-r from-green-900 to-green-800 px-4 py-3">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-green-800/50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                );
              })}

              {/* Mobile Schedules Section */}
              <div className="pt-2">
                <div className="flex items-center gap-3 px-4 py-3 text-white">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Schedules</span>
                </div>
                <div className="pl-8 flex flex-col space-y-1">
                  <a
                    href="/schedules"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-green-800/50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>Normal</span>
                  </a>
                  <a
                    href="/custom-schedules"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-green-800/50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>Custom</span>
                  </a>
                </div>
              </div>

              {/* Mobile Profile Section */}
              <div className="pt-2 border-t border-green-800/50 mt-2">
                <div className="flex items-center gap-3 px-4 py-3 text-white">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Account</span>
                </div>
                <div className="pl-8 flex flex-col space-y-1">
                  <button
                    onClick={() => {
                      setIsChangePasswordOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-green-800/50 rounded-lg transition-colors text-left"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-green-800/50 rounded-lg transition-colors text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors text-left"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        access_token={access_token}
      />
    </>
  );
}
