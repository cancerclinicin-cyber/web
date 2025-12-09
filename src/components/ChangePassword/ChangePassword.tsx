"use client";

import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import SuccessMessage from "../common/Messages/Success"; // Make sure this import is correct

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{
    success: boolean | string;
    message?: string;
    status?: number | string;
  }>;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await onSubmit(currentPassword, newPassword);

      const normalizedSuccess =
        result.success === true ||
        (typeof result.success === "string" && result.success.toLowerCase() === "true");

      const normalizedStatus =
        result.status === 200 ||
        (typeof result.status === "string" && parseInt(result.status, 10) === 200);

      if (normalizedSuccess && normalizedStatus) {
        setSuccess(true);
        setShowSuccess(true);
        setTimeout(() => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setSuccess(false);
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(result.message || "Failed to change password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
      setShowSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white/80 hover:text-white disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-green-100 mt-2">
            Secure your account with a new password
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-5 flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">Password changed successfully!</span>
            </div>
          )}

          {showSuccess && (
            <SuccessMessage
              message="Password Changed"
              description="Your password has been successfully updated"
              isVisible={showSuccess}
              onClose={() => setShowSuccess(false)}
            />
          )}

          {/* Fields */}
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            show={showCurrentPassword}
            onChange={setCurrentPassword}
            onToggle={() => setShowCurrentPassword((v) => !v)}
            disabled={isLoading}
          />

          <PasswordField
            id="new-password"
            label="New Password"
            value={newPassword}
            show={showNewPassword}
            onChange={setNewPassword}
            onToggle={() => setShowNewPassword((v) => !v)}
            disabled={isLoading}
            hint="Must be at least 8 characters"
          />

          <PasswordField
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            show={showConfirmPassword}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((v) => !v)}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            For security reasons, make sure your new password is strong and unique
          </p>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
  disabled: boolean;
  hint?: string;
}

function PasswordField({
  id,
  label,
  value,
  show,
  onChange,
  onToggle,
  disabled,
  hint,
}: FieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          disabled={disabled}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          disabled={disabled}
        >
          {show ? (
            <EyeOff className="h-5 w-5 text-gray-500 hover:text-teal-600 transition-colors" />
          ) : (
            <Eye className="h-5 w-5 text-gray-500 hover:text-teal-600 transition-colors" />
          )}
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
