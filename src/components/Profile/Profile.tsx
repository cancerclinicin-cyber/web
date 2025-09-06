"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  Camera,
  AlertCircle,
  X
} from "lucide-react";
import SuccessMessage from "../common/Messages/Success";
import httpService from "../../common/utils/httpService";

// Define the profile data structure based on API response
interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  access_token: string;
}

interface ConsultationService {
  id: number;
  service_name: string;
  initial_consultation_price: number;
  follow_up_consultation_price: number;
  initial_slot_duration_minutes: number;
  follow_up_slot_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  admin_user: AdminUser;
  consultation_service: ConsultationService;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  access_token: string | null;
}

export default function ProfileModal({ isOpen, onClose, access_token }: ProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserData, setEditedUserData] = useState<Partial<AdminUser> | null>(null);
  const [editedServiceData, setEditedServiceData] = useState<Partial<ConsultationService> | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen && access_token) {
      fetchProfileData();
    }
  }, [isOpen, access_token]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setError(null);
      setLogoPreview(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const fetchProfileData = async () => {
    if (!access_token) {
      setError("Authentication access_token not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await httpService.get<ProfileData>(
        "admin/admin_settings",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      console.log("Profile data received:", response.data); // Debug log
      setProfileData(response.data);
      setEditedUserData({
        first_name: response.data.admin_user.first_name,
        last_name: response.data.admin_user.last_name
      });
      setEditedServiceData({
        initial_consultation_price: response.data.consultation_service.initial_consultation_price,
        follow_up_consultation_price: response.data.consultation_service.follow_up_consultation_price
      });
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message || "Failed to fetch profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (profileData) {
      setEditedUserData({
        first_name: profileData.admin_user.first_name,
        last_name: profileData.admin_user.last_name
      });
      setEditedServiceData({
        initial_consultation_price: profileData.consultation_service.initial_consultation_price,
        follow_up_consultation_price: profileData.consultation_service.follow_up_consultation_price
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLogoPreview(null);
    if (profileData) {
      setEditedUserData({
        first_name: profileData.admin_user.first_name,
        last_name: profileData.admin_user.last_name
      });
      setEditedServiceData({
        initial_consultation_price: profileData.consultation_service.initial_consultation_price,
        follow_up_consultation_price: profileData.consultation_service.follow_up_consultation_price
      });
    }
  };

  const handleSave = async () => {
    if (!access_token) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const formdata = new FormData();
      
      // Add user data (only editable fields)
      if (editedUserData) {
        formdata.append("first_name", editedUserData.first_name || "");
        formdata.append("last_name", editedUserData.last_name || "");
        // Include non-editable fields as per API requirements
        formdata.append("phone_number", profileData?.admin_user.phone_number || "");
      }
      
      // Add service data (only editable fields)
      if (editedServiceData) {
        formdata.append("initial_consultation_price", editedServiceData.initial_consultation_price?.toString() || "0");
        formdata.append("follow_up_consultation_price", editedServiceData.follow_up_consultation_price?.toString() || "0");
        // Include non-editable fields as per API requirements
        formdata.append("initial_slot_duration_minutes", profileData?.consultation_service.initial_slot_duration_minutes.toString() || "0");
        formdata.append("follow_up_slot_duration_minutes", profileData?.consultation_service.follow_up_slot_duration_minutes.toString() || "0");
      }
      
      // Add logo if selected
      if (fileInputRef.current?.files?.[0]) {
        formdata.append("logo", fileInputRef.current.files[0]);
      }
      
      await httpService.patch(
        "admin/admin_settings",
        formdata,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      // Re-fetch the updated data
      await fetchProfileData();
      setIsEditing(false);
      setLogoPreview(null);
      setShowSuccess(true); // Show success message
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save profile data");
    } finally {
      setSaving(false);
    }
  };

  const handleUserInputChange = (field: keyof AdminUser, value: string) => {
    setEditedUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceInputChange = (field: keyof ConsultationService, value: string) => {
    setEditedServiceData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-teal-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">My Profile</h2>
                <p className="text-green-100">Manage your personal information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : profileData ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="lg:w-1/3 flex flex-col items-center">
                <div className="relative">
                  <div 
                    className="w-48 h-48 rounded-full bg-gradient-to-br from-green-100 to-teal-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={isEditing ? triggerFileInput : undefined}
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : profileData ? (
                      <div className="text-center">
                        <User className="h-20 w-20 text-green-600 mx-auto" />
                        <p className="text-green-700 mt-2 font-medium">Upload Logo</p>
                      </div>
                    ) : (
                      <User className="h-24 w-24 text-green-600" />
                    )}
                  </div>
                  {isEditing && (
                    <div 
                      className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 border border-gray-200 cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-5 w-5 text-gray-700" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {isEditing && logoPreview && (
                  <p className="mt-3 text-sm text-green-600 flex items-center">
                    <span className="h-2 w-2 bg-green-600 rounded-full mr-2"></span>
                    Logo selected. It will be uploaded on save.
                  </p>
                )}
                
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  {profileData.admin_user.first_name} {profileData.admin_user.last_name}
                </h2>
                <p className="text-gray-600 mt-1">{profileData.admin_user.email_address}</p>
                
                <div className="mt-8 w-full">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="text-gray-900">{profileData.admin_user.email_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="text-gray-900">{profileData.admin_user.phone_number || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-5 w-5 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500">Account Created</p>
                        <p className="text-gray-900">
                          {new Date(profileData.admin_user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-5 w-5 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="text-gray-900">
                          {new Date(profileData.admin_user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Profile Details Section */}
              <div className="lg:w-2/3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Details</h3>
                  <div>
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserData?.first_name || ""}
                            onChange={(e) => handleUserInputChange("first_name", e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                            {profileData.admin_user.first_name}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedUserData?.last_name || ""}
                            onChange={(e) => handleUserInputChange("last_name", e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                            {profileData.admin_user.last_name}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                          {profileData.admin_user.email_address}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                          {profileData.admin_user.phone_number || "Not provided"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Phone number cannot be changed</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Information */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Service Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-3">{profileData.consultation_service.service_name}</h5>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Consultation Price (₹)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editedServiceData?.initial_consultation_price || ""}
                                onChange={(e) => handleServiceInputChange("initial_consultation_price", e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            ) : (
                              <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200 font-medium">
                                ₹{profileData.consultation_service.initial_consultation_price}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Slot Duration
                            </label>
                            <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                              {profileData.consultation_service.initial_slot_duration_minutes} minutes
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Slot duration cannot be changed</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-3">Follow-up Details</h5>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Follow-up Consultation Price (₹)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editedServiceData?.follow_up_consultation_price || ""}
                                onChange={(e) => handleServiceInputChange("follow_up_consultation_price", e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            ) : (
                              <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200 font-medium">
                                ₹{profileData.consultation_service.follow_up_consultation_price}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Follow-up Slot Duration
                            </label>
                            <p className="py-2.5 text-gray-900 bg-white px-4 rounded-lg border border-gray-200">
                              {profileData.consultation_service.follow_up_slot_duration_minutes} minutes
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Slot duration cannot be changed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-xl font-medium text-gray-900">No profile data</h3>
              <p className="mt-2 text-gray-500">Profile information could not be loaded.</p>
              <button
                onClick={fetchProfileData}
                className="mt-6 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Success Message Component */}
      <SuccessMessage
        message="Profile Updated"
        description="Your profile has been successfully updated"
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}