"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import { Phone, Mail, MapPin } from "lucide-react";
import { decryptId } from '../../common/utils/encryption';

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
  booked_slots: Array<{
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
  }>;
}

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
  appointments: Appointment[];
  last_appointment_date: string | null;
}

interface RecentAppointment {
  id: number;
  patient_id: number;
  treatment_history: string;
  additional_details: string;
  created_at: string;
  updated_at: string;
  meet_link: string;
  appointment_status: string;
  code: string;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  slot_date: string | null;
  slot_time: string | null;
  schedule_id: number | null;
  booked_slots: Array<{
    id: number;
    schedule_id: number;
    appointment_id: number;
    slot_date: string;
    slot_time: string;
    is_booked: boolean;
    created_at: string;
    updated_at: string;
    status: boolean;
    booking_status: string;
  }>;
}

interface RecentAppointmentsResponse {
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  recent_appointments: RecentAppointment[];
}

export default function PatientDetails() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if patient data was passed via navigation state
    if (location.state?.patient) {
      console.log("Patient data from navigation state:", location.state.patient);
      setPatient(location.state.patient);
      // Fetch recent appointments for this patient
      fetchRecentAppointments(location.state.patient.id.toString());
      setLoading(false);
    } else if (id) {
      // Fallback: fetch patient details if not passed via state
      fetchPatientDetails();
    }
  }, [id, location.state]);

  const fetchPatientDetails = async () => {
    if (!id) {
      setError("No patient ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decrypt the ID if it's encrypted
      const actualId = decryptId(id);
      console.log("Fetching patient details for ID:", actualId);

      const response = await httpService.get<{ data: Patient }>(
        `admin/patients/${actualId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Patient details response:", response.data);
      setPatient(response.data.data);

      // Fetch recent appointments for this patient
      await fetchRecentAppointments(actualId);

    } catch (err) {
      console.error("Error fetching patient details:", err);
      setError(`Failed to fetch patient details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAppointments = async (patientId: string) => {
    try {
      const response = await httpService.get<RecentAppointmentsResponse>(
        `admin/consultations/recent_by_patient?patient_id=${patientId}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Recent appointments response:", response.data);
      setRecentAppointments(response.data.recent_appointments || []);

    } catch (err) {
      console.error("Error fetching recent appointments:", err);
      // Don't set error state for recent appointments, just log it
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return "N/A";

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If birthday hasn't occurred this year yet, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age.toString();
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

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Patient</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/patients')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Back to Patients
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
            <button className="flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap bg-green-800 text-white">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Patients</span>
            </button>
            <button className="flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap text-green-100 hover:bg-green-600 transition-colors">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Appointments</span>
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
                    onClick={() => navigate('/patients')}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    Patients
                  </button>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="text-gray-500">Patient Details</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="w-full px-0 py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
          {/* Patient Details Card - Full Width */}
          <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 rounded-none shadow-2xl p-8 border-0">
            {/* Header Section with Colorful Background */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-10"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full w-20 h-20 flex items-center justify-center text-white font-bold text-2xl mr-6 shadow-lg">
                      {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {patient.first_name} {patient.last_name}
                      </h1>
                      <p className="text-purple-600 font-medium">Patient Details</p>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          Active Patient
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic Information Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">Basic Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-blue-700 mb-1">Full Name</label>
                    <p className="text-blue-900 font-medium">{patient.first_name} {patient.last_name}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-blue-700 mb-1">Date of Birth</label>
                    <p className="text-blue-900">{formatDate(patient.date_of_birth)}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-blue-700 mb-1">Age & Gender</label>
                    <p className="text-blue-900">{calculateAge(patient.date_of_birth)} years, {patient.gender}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-blue-700 mb-1">Registration Date</label>
                    <p className="text-blue-900">{formatDate(patient.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 mb-1">Email</label>
                        <p className="text-purple-900">{patient.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 mb-1">Phone</label>
                        <p className="text-purple-900">{patient.phone_number}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-1" />
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 mb-1">Address</label>
                        <p className="text-purple-900">{patient.address || "Address not available"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">Quick Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Last Visit</label>
                    <p className="text-pink-900">{formatDate(patient.last_appointment_date)}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Patient Since</label>
                    <p className="text-pink-900">{formatDate(patient.created_at)}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <label className="block text-sm font-semibold text-pink-700 mb-1">Status</label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments Section */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200/50 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-900">Recent Appointments</h3>
                </div>

                {recentAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-green-200">
                      <thead className="bg-gradient-to-r from-green-600 to-teal-600">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Slot Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Slot Time
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentAppointments.map((appointment, index) => (
                          <tr key={appointment.id} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-green-25'}`}>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.slot_date ? formatDate(appointment.slot_date) : 'Not scheduled'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">
                                {appointment.slot_time || 'No time set'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appointment.appointment_status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.appointment_status === 'Scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.appointment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-green-600">
                                ₹{appointment.amount ? appointment.amount.toLocaleString() : '0'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Appointments</h3>
                    <p className="text-gray-500">This patient doesn't have any recent appointments.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}