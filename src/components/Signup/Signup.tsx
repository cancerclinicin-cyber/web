"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, User, FileText, Clock, Upload, X, Check, CheckCircle } from "lucide-react";
import { format, parse, differenceInYears } from "date-fns";

// Define types for API response
interface AvailableSlot {
  start: string;
  end: string;
}

interface ScheduleResponse {
  id: number;
  date: string;
  day: string;
  source: string;
  slot_duration_minutes: number;
  total_slots: number;
  available_slots: AvailableSlot[];
}

interface PatientRegistrationResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  age: number;
  address: string;
  created_at: string;
  updated_at: string;
}

export default function SignupTabs() {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "male",
    dateOfBirth: "",
    age: 0,
    address: "",
    medicalHistory: "",
    pathologyReports: [] as File[],
    radiologyReports: [] as File[],
    additionalDetails: "",
    additionalDocuments: [] as File[],
    appointmentDate: "",
    appointmentSlot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showSlotSelection, setShowSlotSelection] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingSuccessful, setBookingSuccessful] = useState(false);
  const [apiSubmitting, setApiSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const pathologyRef = useRef<HTMLInputElement>(null);
  const radiologyRef = useRef<HTMLInputElement>(null);
  const additionalDocRef = useRef<HTMLInputElement>(null);

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      try {
        const dob = parse(formData.dateOfBirth, "yyyy-MM-dd", new Date());
        const calculatedAge = differenceInYears(new Date(), dob);
        setFormData(prev => ({
          ...prev,
          age: calculatedAge
        }));
      } catch (e) {
        // If date parsing fails, keep current age
      }
    }
  }, [formData.dateOfBirth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Reset slot selection when date changes
    if (name === "appointmentDate") {
      setFormData(prev => ({
        ...prev,
        appointmentSlot: ""
      }));
      setAvailableSlots([]);
      setShowSlotSelection(false);
      
      // Fetch slots when date is selected
      if (value) {
        fetchAvailableSlots(value);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'pathology' | 'radiology' | 'additional') => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      setFormData(prev => {
        if (fileType === 'pathology') {
          return {
            ...prev,
            pathologyReports: [...prev.pathologyReports, ...files]
          };
        } else if (fileType === 'radiology') {
          return {
            ...prev,
            radiologyReports: [...prev.radiologyReports, ...files]
          };
        } else {
          return {
            ...prev,
            additionalDocuments: [...prev.additionalDocuments, ...files]
          };
        }
      });
      
      // Clear error if files are selected
      if (errors[`${fileType}Reports`] || errors[`${fileType}Documents`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${fileType}Reports`];
          delete newErrors[`${fileType}Documents`];
          return newErrors;
        });
      }
    }
  };

  // Enhanced email validation
  const isValidEmail = (email: string) => {
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeTab === "personal") {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }
    }
    
    if (activeTab === "medical") {
      // All fields are optional in this tab
    }
    
    if (activeTab === "details") {
      // All fields are optional in this tab
    }
    
    if (activeTab === "appointment") {
      if (!formData.appointmentDate) {
        newErrors.appointmentDate = "Appointment date is required";
      } else {
        // Check if appointment date is in the past
        const appointment = new Date(formData.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointment < today) {
          newErrors.appointmentDate = "Appointment date cannot be in the past";
        }
      }
      
      if (!formData.appointmentSlot && showSlotSelection) {
        newErrors.appointmentSlot = "Please select an appointment slot";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      const tabs = ["personal", "medical", "details", "appointment"];
      const currentIndex = tabs.indexOf(activeTab);
      
      // If moving from personal tab, submit API
      if (activeTab === "personal") {
        submitPatientRegistration();
      } else if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
  };

  const handlePrevious = () => {
    const tabs = ["personal", "medical", "details", "appointment"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Initialize Razorpay payment
      loadRazorpay();
    }
  };

  const loadRazorpay = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      openRazorpay();
    };
    script.onerror = () => {
      alert('Failed to load Razorpay. Please try again.');
      setPaymentProcessing(false);
    };
    document.body.appendChild(script);
  };

  const openRazorpay = () => {
    setPaymentProcessing(true);
    
    const options = {
      key: 'rzp_test_1DP5mmOlF5G5ag', // Replace with your Razorpay key
      amount: 50000, // Amount in paise (50000 paise = 500 INR)
      currency: 'INR',
      name: 'Medical Appointment',
      description: 'Appointment Booking Payment',
      handler: function (response: any) {
        // Simulate successful booking after payment
        setTimeout(() => {
          setPaymentProcessing(false);
          setBookingSuccessful(true);
        }, 1000);
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phoneNumber,
      },
      theme: {
        color: '#3399cc'
      }
    };

    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const fetchAvailableSlots = async (dateString: string) => {
    if (!dateString) return;
    
    setLoadingSlots(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.appointmentDate;
      return newErrors;
    });
    
    try {
      const myHeaders = new Headers();
      myHeaders.append("Accept", "application/json");
      
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };
      
      const response = await fetch(
        `http://localhost:3000/api/v1/patients/patient_registrations/123/check_available_schedule?date=${dateString}&is_already_registered=false`,
        requestOptions
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ScheduleResponse = await response.json();
      setAvailableSlots(result.available_slots);
      setShowSlotSelection(true);
      
      if (result.available_slots.length === 0) {
        setErrors(prev => ({
          ...prev,
          appointmentDate: "Doctor is not available for the day, please select different date"
        }));
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setErrors(prev => ({
        ...prev,
        appointmentDate: "Doctor is not available for the day, please select different date"
      }));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      appointmentSlot: slot
    }));
    
    // Clear any previous errors
    if (errors.appointmentSlot) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.appointmentSlot;
        return newErrors;
      });
    }
    
    // Automatically proceed to payment after slot selection
    setTimeout(() => {
      loadRazorpay();
    }, 500);
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.click();
    }
  };

  const removeFile = (fileType: 'pathology' | 'radiology' | 'additional', index: number) => {
    setFormData(prev => {
      const updatedFiles = [...prev[`${fileType}Reports` as keyof typeof prev] as File[]];
      updatedFiles.splice(index, 1);
      
      return {
        ...prev,
        [`${fileType}Reports`]: updatedFiles
      };
    });
  };

  const removeAdditionalFile = (index: number) => {
    setFormData(prev => {
      const updatedFiles = [...prev.additionalDocuments];
      updatedFiles.splice(index, 1);
      
      return {
        ...prev,
        additionalDocuments: updatedFiles
      };
    });
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Format date for user-friendly display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const tabs = ["personal", "medical", "details", "appointment"];
    const currentIndex = tabs.indexOf(activeTab);
    return ((currentIndex + 1) / tabs.length) * 100;
  };

  // Reset form and start over
  const handleReset = () => {
    setBookingSuccessful(false);
    setActiveTab("personal");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      gender: "male",
      dateOfBirth: "",
      age: 0,
      address: "",
      medicalHistory: "",
      pathologyReports: [],
      radiologyReports: [],
      additionalDetails: "",
      additionalDocuments: [],
      appointmentDate: "",
      appointmentSlot: "",
    });
    setErrors({});
    setAvailableSlots([]);
    setShowSlotSelection(false);
    setApiError("");
  };

  // Submit patient registration API
  const submitPatientRegistration = async () => {
    setApiSubmitting(true);
    setApiError("");
    
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        patient: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          age: formData.age,
          address: formData.address
        }
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch("http://localhost:3000/api/v1/patients/patient_registrations", requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: PatientRegistrationResponse = await response.json();
      console.log("Patient registration successful:", result);
      
      // Move to next tab after successful API call
      const tabs = ["personal", "medical", "details", "appointment"];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error submitting patient registration:', error);
      setApiError("Failed to register patient. Please try again.");
    } finally {
      setApiSubmitting(false);
    }
  };

  // Show success message after booking
  if (bookingSuccessful) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-green-600 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Appointment Booking Successful!</h1>
            <p className="text-green-100 mt-2">
              Your appointment has been confirmed for {formatDate(formData.appointmentDate)} at {formData.appointmentSlot}
            </p>
          </div>
          
          <div className="p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Appointment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">{formatDate(formData.appointmentDate)} at {formData.appointmentSlot}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{formData.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                A confirmation email has been sent to {formData.email}. Please check your inbox for further details.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-indigo-700 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
          <p className="text-indigo-200">Join our community in just a few steps</p>
        </div>
        
        <div className="p-6">
          {/* Simplified Progress Bar - Just the line */}
          <div className="mb-8">
            <div className="relative">
              {/* Progress line */}
              <div className="h-2 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute top-0 h-2 bg-indigo-600 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-8">
            {[
              { id: "personal", label: "Personal", icon: User },
              { id: "medical", label: "Medical", icon: FileText },
              { id: "details", label: "Details", icon: FileText },
              { id: "appointment", label: "Appointment", icon: Clock }
            ].map((tab) => (
              <div 
                key={tab.id}
                className={`flex-1 text-center py-4 cursor-pointer relative ${
                  activeTab === tab.id 
                    ? "text-indigo-600 font-medium" 
                    : "text-gray-500"
                }`}
                onClick={() => {
                  if (validateForm()) {
                    setActiveTab(tab.id);
                  }
                }}
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="w-4 h-4 mr-2" />
                  <span className="capitalize">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t"></div>
                )}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            {activeTab === "personal" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="9061002008"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.phoneNumber ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        max={today} // Allow today and past dates
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formData.dateOfBirth && (
                        <div className="mt-1 text-gray-600 text-xs">
                          Selected: {formatDate(formData.dateOfBirth)}
                        </div>
                      )}
                    </div>
                    {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                </div>
                
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 text-sm">{apiError}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={handleNext}
                    disabled={
                      !formData.firstName || 
                      !formData.lastName || 
                      !formData.email || 
                      !formData.phoneNumber || 
                      !formData.dateOfBirth || 
                      !formData.address ||
                      apiSubmitting
                    }
                    className={`px-4 py-2 rounded-md flex items-center ${
                      !formData.firstName || 
                      !formData.lastName || 
                      !formData.email || 
                      !formData.phoneNumber || 
                      !formData.dateOfBirth || 
                      !formData.address ||
                      apiSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {apiSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Next"
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "medical" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                    Medical History
                  </label>
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    placeholder="Please describe your medical history..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Pathology Reports (Optional)
                    </label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400"
                      onClick={() => triggerFileInput(pathologyRef)}
                    >
                      <input
                        type="file"
                        ref={pathologyRef}
                        onChange={(e) => handleFileChange(e, 'pathology')}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                      />
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload pathology reports
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG up to 10MB each
                      </p>
                    </div>
                    
                    {formData.pathologyReports.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {formData.pathologyReports.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm truncate">{file.name}</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile('pathology', index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Radiology Reports (Optional)
                    </label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400"
                      onClick={() => triggerFileInput(radiologyRef)}
                    >
                      <input
                        type="file"
                        ref={radiologyRef}
                        onChange={(e) => handleFileChange(e, 'radiology')}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                      />
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload radiology reports
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG up to 10MB each
                      </p>
                    </div>
                    
                    {formData.radiologyReports.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {formData.radiologyReports.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm truncate">{file.name}</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile('radiology', index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNext}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700">
                    Additional Details
                  </label>
                  <textarea
                    id="additionalDetails"
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={handleInputChange}
                    placeholder="Any additional information..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Documents (Optional)
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400"
                    onClick={() => triggerFileInput(additionalDocRef)}
                  >
                    <input
                      type="file"
                      ref={additionalDocRef}
                      onChange={(e) => handleFileChange(e, 'additional')}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                    />
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload additional documents
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG up to 10MB each
                    </p>
                  </div>
                  
                  {formData.additionalDocuments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {formData.additionalDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeAdditionalFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNext}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "appointment" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
                    Preferred Appointment Date *
                  </label>
                  <div className="relative">
                    <input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      min={today} // Prevent past dates
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.appointmentDate ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formData.appointmentDate && (
                      <div className="mt-1 text-gray-600 text-xs">
                        Selected: {formatDate(formData.appointmentDate)}
                      </div>
                    )}
                  </div>
                  {errors.appointmentDate && <p className="text-red-500 text-sm">{errors.appointmentDate}</p>}
                  <p className="text-xs text-gray-500">Select a date from today onwards</p>
                </div>
                
                {loadingSlots && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading available slots...</p>
                  </div>
                )}
                
                {showSlotSelection && availableSlots.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Appointment Slots
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSlotSelect(`${slot.start}-${slot.end}`)}
                          className={`p-3 border rounded-md text-center transition-colors ${
                            formData.appointmentSlot === `${slot.start}-${slot.end}`
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-gray-300 hover:border-indigo-400"
                          }`}
                        >
                          <div className="font-medium">{slot.start}</div>
                          <div className="text-xs text-gray-500">to {slot.end}</div>
                          {formData.appointmentSlot === `${slot.start}-${slot.end}` && (
                            <div className="mt-1 text-indigo-600">
                              <Check className="w-4 h-4 mx-auto" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.appointmentSlot && <p className="text-red-500 text-sm">{errors.appointmentSlot}</p>}
                    <p className="text-xs text-gray-500">
                      {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                )}
                
                {showSlotSelection && availableSlots.length === 0 && !loadingSlots && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700 text-sm">
                      Doctor is not available for the day, please select different date
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSubmit}
                    disabled={paymentProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {paymentProcessing ? "Processing..." : "Proceed to Payment"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}