import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import { X } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

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

interface EditCustomScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: CustomSchedule | null;
  onSuccess: () => void;
}

export default function EditCustomScheduleModal({
  isOpen,
  onClose,
  schedule,
  onSuccess
}: EditCustomScheduleModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && schedule) {
      setScheduledDate(schedule.scheduled_date.split('T')[0]); // Extract date part

      // Extract time from the datetime strings
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);

      const startTimeStr = startDate.toTimeString().slice(0, 5); // HH:MM
      const endTimeStr = endDate.toTimeString().slice(0, 5); // HH:MM

      setStartTime(startTimeStr);
      setEndTime(endTimeStr);
      setTimeError(''); // Clear any previous errors
    }
  }, [isOpen, schedule]);

  // Validate time range
  const validateTimeRange = (start: string, end: string) => {
    if (start && end) {
      const startDateTime = new Date(`2000-01-01T${start}`);
      const endDateTime = new Date(`2000-01-01T${end}`);

      if (endDateTime <= startDateTime) {
        setTimeError('End time must be greater than start time');
        return false;
      }
    }
    setTimeError('');
    return true;
  };

  // Handle start time change
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    if (endTime) {
      validateTimeRange(newStartTime, endTime);
    }
  };

  // Handle end time change
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    if (startTime) {
      validateTimeRange(startTime, newEndTime);
    }
  };

  const handleSave = async () => {
    if (!schedule || !scheduledDate || !startTime || !endTime) return;

    // Validate time range before saving
    if (!validateTimeRange(startTime, endTime)) return;

    setLoading(true);
    try {
      // Times are already in HH:MM format from the input

      await httpService.put(
        'admin/schedules/update_by_date/',
        {
          scheduled_date: scheduledDate,
          schedule: {
            id: schedule.id,
            start_time: startTime + ':00',
            end_time: endTime + ':00'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update schedule', err);
      const errorObj = err as { response?: { data?: { message?: string; error?: string } }; message?: string };

      // Get the exact error message from API response
      const apiErrorMessage = errorObj?.response?.data?.message ||
                             errorObj?.response?.data?.error ||
                             errorObj?.message ||
                             "Failed to update schedule. Please try again.";

      setErrorMessage(apiErrorMessage);
      setShowError(true);
      // Clear any existing success messages
      setShowSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Edit Custom Schedule
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Schedule Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-2">Schedule Details</h3>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-green-700">Current Date:</span> {new Date(schedule.scheduled_date).toLocaleDateString()}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={handleStartTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={handleEndTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              />
              {timeError && (
                <p className="mt-1 text-sm text-red-600">{timeError}</p>
              )}
            </div>
            {showError && (
              <ErrorMessage
                message={errorMessage}
                onClose={() => setShowError(false)}
                className="mb-4"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!scheduledDate || !startTime || !endTime || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-600 border border-transparent rounded-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}