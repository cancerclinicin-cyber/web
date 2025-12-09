"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store';
import { startMeeting } from './meetingSlice';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import SuccessMessage from '../common/Messages/Success';
import { Search, Calendar, Video, FileText, ChevronUp, ChevronDown, User } from "lucide-react";
import { encryptId } from '../../common/utils/encryption';
import RescheduleModal from '../common/RescheduleModal';
import { useLoading } from '../common/LoadingContext';

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

interface ApiResponse {
  data: Appointment[];
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  current_count: number;
}


export default function Appointments() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsLoading, setLoadingMessage } = useLoading();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Appointment; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDescription, setSuccessDescription] = useState('');

  // Fetch appointments from API
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    setIsLoading(true);
    setLoadingMessage("Loading appointments...");

    try {
      const sortBy = sortConfig?.key || 'created_at';
      const sortDir = sortConfig?.direction || 'desc';

      const response = await httpService.get<ApiResponse>(
        `admin/consultations?page=${currentPage}&per_page=${itemsPerPage}&sort_by=${sortBy}&sort_dir=${sortDir}&search=${debouncedSearchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAppointments(response.data.data);
      setTotalCount(response.data.total_count);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to fetch appointments. Please try again later.");
    } finally {
      setLoading(false);
      setIsLoading(false);
      // Maintain focus on search input after API response
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch appointments when dependencies change
  useEffect(() => {
    // Only search if debounced search term has 3+ characters or is empty
    if (debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= 3) {
      fetchAppointments();
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig]);

  // Sort appointments based on sort configuration
  const sortedAppointments = useMemo(() => {
    if (!sortConfig) return appointments;

    return [...appointments].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [appointments, sortConfig]);

  // Handle sorting
  const requestSort = (key: keyof Appointment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset to first page when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  // Handle reschedule
  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  // Handle start meeting
  const handleStartMeeting = (appointment: Appointment) => {
    dispatch(startMeeting(appointment.meet_link));
  };

  // Handle appointment details navigation
  const handleAppointmentDetails = (appointment: Appointment) => {
    const encryptedId = encryptId(appointment.id);
    navigate(`/appointments/${encryptedId}`, { state: { appointment } });
  };

  // Handle edit prescription
  const handleEditPrescription = (appointment: Appointment) => {
    const encryptedId = encryptId(appointment.id);
    navigate(`/appointments/${encryptedId}/edit-prescription`, { state: { appointment } });
  };


  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Appointments</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={fetchAppointments}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Retry
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Appointments</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 mx-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search appointments by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-gray-600 whitespace-nowrap">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2 px-4"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mx-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-600 to-teal-600">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Patient
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Details
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-green-700 transition-colors"
                    onClick={() => requestSort('slot_date')}
                  >
                    <div className="flex items-center">
                      Appointment
                      {sortConfig?.key === 'slot_date' && (
                        sortConfig.direction === 'asc' ?
                        <ChevronUp className="ml-1 h-4 w-4" /> :
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAppointments.length > 0 ? (
                  sortedAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="hover:bg-teal-50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentDetails(appointment);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-xl w-10 h-10 flex items-center justify-center text-white font-bold">
                            {appointment.patient.first_name.charAt(0)}{appointment.patient.last_name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => handleAppointmentDetails(appointment)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 text-left"
                            >
                              {appointment.patient.first_name} {appointment.patient.last_name}
                            </button>
                            <div className="text-xs text-gray-500">
                              {appointment.patient.email}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <svg className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {appointment.patient.phone_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium">Gender:</span>
                            <span className="ml-2 px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full bg-blue-100 text-blue-800">
                              {appointment.patient.gender}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Age:</span>
                            <span className="ml-2">{calculateAge(appointment.patient.date_of_birth)}</span>
                          </div>
                          <div>
                            <span className="font-medium">DOB:</span>
                            <span className="ml-2">{formatDate(appointment.patient.date_of_birth)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{formatDate(appointment.slot_date)}</div>
                          <div className="text-xs text-gray-500 mt-1">{appointment.slot_time || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start space-y-2">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                            appointment.appointment_status === 'Scheduled'
                              ? 'bg-green-100 text-green-800'
                              : appointment.appointment_status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.appointment_status}
                          </span>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">₹{appointment.amount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReschedule(appointment);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group relative"
                            title="Reschedule Appointment"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartMeeting(appointment);
                            }}
                            disabled={!appointment.meet_link}
                            className={`p-2 rounded-lg transition-all duration-200 group relative ${
                              appointment.meet_link
                                ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={appointment.meet_link ? "Start Meeting" : "No meeting link available"}
                          >
                            <Video className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPrescription(appointment);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200 group relative"
                            title="Edit Prescription"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 mx-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> appointments
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`mx-1 w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <RescheduleModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        appointment={selectedAppointment}
        onSuccess={() => {
          setSuccessMessage('Appointment Rescheduled');
          setSuccessDescription('The appointment has been successfully rescheduled.');
          setShowSuccess(true);
          fetchAppointments();
        }}
      />

      <SuccessMessage
        message={successMessage}
        description={successDescription}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
