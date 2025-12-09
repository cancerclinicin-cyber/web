"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import SuccessMessage from '../common/Messages/Success';
import ErrorMessage from '../common/Messages/Error';
import { Search, Edit, ToggleLeft, ToggleRight, Plus, ChevronUp, ChevronDown } from "lucide-react";
import EditCustomScheduleModal from './EditCustomScheduleModal';
import CreateCustomScheduleModal from './CreateCustomScheduleModal';

interface CustomSchedule {
  id: number;
  day: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_hr: string;
  duration_min: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  schedules: CustomSchedule[];
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  current_count: number;
}

export default function CustomSchedules() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [schedules, setSchedules] = useState<CustomSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CustomSchedule; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CustomSchedule | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDescription, setSuccessDescription] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch schedules from API
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);

    try {
      const sortBy = sortConfig?.key || 'scheduled_date';
      const sortDir = sortConfig?.direction || 'desc';

      const response = await httpService.get<ApiResponse>(
        `admin/schedules/next_schedules?page=${currentPage}&per_page=${itemsPerPage}&sort_by=${sortBy}&sort_dir=${sortDir}&search=${debouncedSearchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setSchedules(response.data.schedules);
      setTotalCount(response.data.total_count);
      setTotalPages(response.data.total_pages);
    } catch (err: any) {
      console.error("Error fetching schedules:", err);
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to fetch schedules. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Maintain focus on search input after API response
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle search term changes
  useEffect(() => {
    const isDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(searchTerm);

    if (isDateFormat) {
      // For date searches, update immediately without debounce
      setDebouncedSearchTerm(searchTerm);
    } else {
      // For other searches, use debounce
      const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Fetch schedules when dependencies change
  useEffect(() => {
    // Allow search for dates (YYYY-MM-DD format) or if search term has 3+ characters or is empty
    const isDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(debouncedSearchTerm);
    if (debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= 3 || isDateFormat) {
      fetchSchedules();
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortConfig]);

  // Reset to first page when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Sort schedules based on sort configuration
  const sortedSchedules = useMemo(() => {
    if (!sortConfig) return schedules;

    return [...schedules].sort((a, b) => {
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
  }, [schedules, sortConfig]);

  // Handle sorting
  const requestSort = (key: keyof CustomSchedule) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate duration from start and end times
  const calculateDuration = (startTime: string, endTime: string) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // If end time is before start time, assume it's next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours: durationHours, minutes: durationMinutes };
  };

  // Handle edit
  const handleEdit = (schedule: CustomSchedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  // Handle create
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  // Handle toggle status
  const handleToggleStatus = async (schedule: CustomSchedule) => {
    try {
      await httpService.put(
        `admin/schedules/${schedule.id}/toggle_status`,
        undefined,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Update local state
      setSchedules(prev =>
        prev.map(s =>
          s.id === schedule.id
            ? { ...s, status: !s.status }
            : s
        )
      );

      // Show success message
      setSuccessMessage('Status Updated');
      setSuccessDescription(`Schedule for ${formatDate(schedule.scheduled_date)} has been ${!schedule.status ? 'activated' : 'deactivated'} successfully.`);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error updating status:", err);
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to update status. Please try again.";
      setErrorMessage(errorMessage);
      setShowError(true);
      // Clear any existing success messages
      setShowSuccess(false);
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    fetchSchedules();
    setShowEditModal(false);
    setSelectedSchedule(null);
    setSuccessMessage('Schedule Updated');
    setSuccessDescription('The schedule has been successfully updated.');
    setShowSuccess(true);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    fetchSchedules();
    setShowCreateModal(false);
    setSuccessMessage('Schedule Created');
    setSuccessDescription('The new schedule has been successfully created.');
    setShowSuccess(true);
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
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Schedules</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={fetchSchedules}
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 mx-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search schedules by date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Schedule</span>
              </button>

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

        {/* Schedules Table */}
        <div className="flex justify-center px-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-6xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-600 to-teal-600">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-green-700 transition-colors"
                      onClick={() => requestSort('scheduled_date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig?.key === 'scheduled_date' && (
                          sortConfig.direction === 'asc' ?
                          <ChevronUp className="ml-1 h-4 w-4" /> :
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Start Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      End Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Duration
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
                  {sortedSchedules.length > 0 ? (
                    sortedSchedules.map((schedule) => (
                      <tr
                        key={schedule.id}
                        className="hover:bg-teal-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(schedule.scheduled_date)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatTime(schedule.start_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatTime(schedule.end_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {(() => {
                              const duration = calculateDuration(schedule.start_time, schedule.end_time);
                              return `${duration.hours}h ${duration.minutes}m`;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                            schedule.status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {schedule.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(schedule)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group relative"
                              title="Edit Schedule"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(schedule)}
                              className={`p-2 rounded-lg transition-all duration-200 group relative ${
                                schedule.status
                                  ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                  : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              }`}
                              title={schedule.status ? "Deactivate Schedule" : "Activate Schedule"}
                            >
                              {schedule.status ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No schedules found</h3>
                          <p className="text-gray-500">Try adjusting your search or create a new schedule.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 mx-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> schedules
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

      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <EditCustomScheduleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onSuccess={handleEditSuccess}
      />

      <CreateCustomScheduleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <SuccessMessage
        message={successMessage}
        description={successDescription}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      <ErrorMessage
        message="Operation Failed"
        description={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
    </>
  );
}