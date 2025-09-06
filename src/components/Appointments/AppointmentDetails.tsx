"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, FileText, DollarSign } from "lucide-react";

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
  schedule_id: number;
  appointment_id: number;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
  status: boolean;
  booking_status: string;
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
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  slot_date: string | null;
  slot_time: string | null;
  schedule_id: number | null;
  patient: Patient;
  booked_slots: BookedSlot[];
  last_appointment_date: string | null;
  patient_name: string;
  patient_phone: string;
  treatment_type: string;
  status: string;
  is_already_registered: boolean;
}

export default function AppointmentDetails() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if appointment data was passed via navigation state
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
      setLoading(false);
    } else if (id) {
      // Fetch appointment details if not passed via state
      fetchAppointmentDetails();
    }
  }, [id, location.state]);

  const fetchAppointmentDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await httpService.get<{ data: Appointment }>(
        `http://localhost:3000/api/v1/admin/consultations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAppointment(response.data.data);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      setError("Failed to fetch appointment details. Please try again later.");
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/appointments')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Appointment Details</h1>
          <p className="text-gray-600">Appointment #{appointment.code}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Appointment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    Appointment Date
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(appointment.slot_date)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4 mr-2" />
                    Appointment Time
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {appointment.slot_time || "N/A"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Amount
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{appointment.amount}
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
                  <p className="text-sm text-gray-600">Patient #{appointment.patient.code}</p>
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
                  onClick={() => navigate(`/appointments/${appointment.id}/edit-prescription`, { state: { appointment } })}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Prescription
                </button>
                {appointment.meet_link && (
                  <button
                    onClick={() => window.open(appointment.meet_link, '_blank')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
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
  );
}