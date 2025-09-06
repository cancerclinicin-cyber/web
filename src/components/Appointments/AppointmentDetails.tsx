"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import SuccessMessage from '../common/Messages/Success';
import { Calendar, Clock, User, Phone, Mail, MapPin, FileText, DollarSign, Download, Eye } from "lucide-react";
import { decryptId, encryptId } from '../../common/utils/encryption';
import RescheduleModal from '../common/RescheduleModal';
import config from '../../../configLoader';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  age: number;
  gender: string;
  address: string;
  created_at: string;
  updated_at: string;
  code: string;
}

interface BookedSlot {
  id: number;
  schedule_id: number | null;
  appointment_id: number;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
  status: boolean;
  booking_status: string;
}

interface FileItem {
  id: number;
  appointment_id: number;
  file: {
    url: string;
  };
  file_path: string;
  created_at: string;
  updated_at: string;
}


interface Appointment {
  id: number;
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  created_at: string;
  updated_at: string;
  meet_link: string;
  appointment_status: string;
  code: string;
  payment_id: string | null;
  order_id: string | null;
  amount: number | null;
  currency: string | null;
  slot_date: string | null;
  slot_time: string | null;
  schedule_id: number | null;
  patient: Patient;
  booked_slots: BookedSlot[];
  pathology_files: FileItem[];
  imageology_files: FileItem[];
  additional_files: FileItem[];
  last_appointment_date: string | null;
  patient_name: string;
  patient_phone: string;
  treatment_type: string;
  status: string;
  is_already_registered: boolean;
  is_inr: boolean;
}

export default function AppointmentDetails() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDescription, setSuccessDescription] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  useEffect(() => {
    // Check if appointment data was passed via navigation state
    if (location.state?.appointment) {
      console.log("Appointment data from navigation state:", location.state.appointment);
      setAppointment(location.state.appointment);
      setLoading(false);
    } else if (id) {
      // Fallback: fetch appointment details if not passed via state
      fetchAppointmentDetails();
    }
  }, [id, location.state]);

  // Debug file information
  useEffect(() => {
    if (appointment) {
      console.log('Appointment files:', {
        pathology: appointment.pathology_files?.length || 0,
        imageology: appointment.imageology_files?.length || 0,
        additional: appointment.additional_files?.length || 0,
        pathology_files: appointment.pathology_files,
        imageology_files: appointment.imageology_files,
        additional_files: appointment.additional_files
      });
    }
  }, [appointment]);

  const fetchAppointmentDetails = async () => {
    if (!id) {
      setError("No appointment ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decrypt the ID if it's encrypted
      const actualId = decryptId(id);
      console.log("Fetching appointment details for ID:", actualId);

      const response = await httpService.get<{ data: Appointment }>(
        `admin/consultations/${actualId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Appointment details response:", response.data);
      setAppointment(response.data.data);

    } catch (err) {
      console.error("Error fetching appointment details:", err);
      setError(`Failed to fetch appointment details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get slot date and time from booked_slots if main fields are null
  const getSlotDate = () => {
    if (!appointment) return null;
    if (appointment.slot_date) return appointment.slot_date;
    if (appointment.booked_slots && appointment.booked_slots.length > 0) {
      return appointment.booked_slots[0].slot_date;
    }
    return null;
  };

  const getSlotTime = () => {
    if (!appointment) return null;
    if (appointment.slot_time) return appointment.slot_time;
    if (appointment.booked_slots && appointment.booked_slots.length > 0) {
      return appointment.booked_slots[0].slot_time;
    }
    return null;
  };

  // Helper function to construct full file URL
  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    // Try different URL constructions
    const baseUrl = config.API_BASE_URL.replace('/api/v1', '');

    // First try: direct combination
    const directUrl = `${baseUrl}${fileUrl}`;

    // Second try: if the file path doesn't start with /, add it
    const correctedUrl = fileUrl.startsWith('/') ? directUrl : `${baseUrl}/${fileUrl}`;

    console.log('Original file URL:', fileUrl);
    console.log('Constructed file URL:', correctedUrl);

    return correctedUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Appointment</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/appointments')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="root-portal" />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        {/* Mobile Menu */}
        <div className="md:hidden bg-green-700 border-t border-green-600">
          <div className="flex overflow-x-auto py-2 px-2 space-x-1">
            <button className="flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap text-green-100 hover:bg-green-600 transition-colors">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Dashboard</span>
            </button>
            <button className="flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap text-green-100 hover:bg-green-600 transition-colors">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Appointments</span>
            </button>
            <button className="flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap bg-green-800 text-white">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Appointment Details</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex py-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    Appointments
                  </button>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-500">Appointment Details</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointment Info */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Appointment Date
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDate(getSlotDate())}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4 mr-2" />
                      Appointment Time
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {getSlotTime() || "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Amount
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {appointment.amount ? `₹${appointment.amount}` : "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      appointment.appointment_status === 'Scheduled'
                        ? 'bg-green-100 text-green-800'
                        : appointment.appointment_status === 'Completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.appointment_status}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      appointment.payment_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.payment_id ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Booking Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      appointment.booked_slots && appointment.booked_slots.length > 0
                        ? appointment.booked_slots[0].booking_status === 'Scheduled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.booked_slots && appointment.booked_slots.length > 0
                        ? appointment.booked_slots[0].booking_status
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Treatment Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Treatment Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Treatment History</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900">
                      {appointment.treatment_history || "No treatment history available"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900">
                      {appointment.additional_details || "No additional details available"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Uploaded Files
                </h2>
                {!(appointment.pathology_files?.length > 0 || appointment.imageology_files?.length > 0 || appointment.additional_files?.length > 0) ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No files uploaded for this appointment</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {appointment.pathology_files && appointment.pathology_files.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Pathology Reports</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {appointment.pathology_files.map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-red-200">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">
                                    Pathology Report {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-4">
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Opening preview for file:", fullUrl);
                                    window.open(fullUrl, '_blank');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Downloading file:", fullUrl);
                                    const link = document.createElement('a');
                                    link.href = fullUrl;
                                    link.download = `pathology_report_${index + 1}.png`;
                                    link.style.display = 'none';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.imageology_files && appointment.imageology_files.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Imageology Reports</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {appointment.imageology_files.map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">
                                    Imageology Report {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-4">
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Opening preview for file:", fullUrl);
                                    window.open(fullUrl, '_blank');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Downloading file:", fullUrl);
                                    const link = document.createElement('a');
                                    link.href = fullUrl;
                                    link.download = `imageology_report_${index + 1}.png`;
                                    link.style.display = 'none';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.additional_files && appointment.additional_files.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {appointment.additional_files.map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-200">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate block">
                                    Additional Document {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(file.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-4">
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Opening preview for file:", fullUrl);
                                    window.open(fullUrl, '_blank');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const fullUrl = getFileUrl(file.file.url);
                                    console.log("Downloading file:", fullUrl);
                                    const link = document.createElement('a');
                                    link.href = fullUrl;
                                    link.download = `additional_document_${index + 1}.png`;
                                    link.style.display = 'none';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Patient Information Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Patient Information
                </h2>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full w-20 h-20 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      {appointment.patient.first_name.charAt(0)}{appointment.patient.last_name.charAt(0)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.patient.first_name} {appointment.patient.last_name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{appointment.patient.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{appointment.patient.phone_number}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{appointment.patient.gender}, {appointment.patient.age} years old</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                      <span className="text-gray-900">{appointment.patient.address || "Address not available"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 mb-3"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reschedule Appointment
                  </button>
                  <button
                    onClick={() => navigate(`/appointments/${encryptId(appointment.id)}/edit-prescription`, { state: { appointment } })}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Prescription
                  </button>
                  {appointment.meet_link && (
                    <button
                      onClick={() => window.open(appointment.meet_link, '_blank')}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Start Meeting
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessMessage
        message={successMessage}
        description={successDescription}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />


      <RescheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        appointment={appointment}
        onSuccess={(newDate?: string, newTime?: string) => {
          setSuccessMessage('Appointment Rescheduled');
          setSuccessDescription('The appointment has been successfully rescheduled.');
          setShowSuccess(true);

          // Update the local appointment state with new date/time if provided
          if (newDate || newTime) {
            setAppointment(prev => prev ? {
              ...prev,
              slot_date: newDate || prev.slot_date,
              slot_time: newTime || prev.slot_time
            } : null);
          } else {
            // Fallback: refresh the appointment data
            setTimeout(() => {
              fetchAppointmentDetails();
            }, 500);
          }
        }}
      />
    </>
  );
}