import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { X } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';


interface Schedule {
  id: number;
  day: string;
  schedules_count: number;
  start_time: string;
  end_time: string;
  duration_hr: number | null;
  duration_min: number | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onSuccess: () => void;
}

export default function EditScheduleModal({
  isOpen,
  onClose,
  schedule,
  onSuccess
}: EditScheduleModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen && schedule) {
      // Extract time from the datetime strings
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);

      const startTimeStr = startDate.toTimeString().slice(0, 5); // HH:MM
      const endTimeStr = endDate.toTimeString().slice(0, 5); // HH:MM

      setStartTime(startTimeStr);
      setEndTime(endTimeStr);
    }
  }, [isOpen, schedule]);

  const handleSave = async () => {
    if (!schedule || !startTime || !endTime) return;

    // Validate that start time is less than end time
    if (startTime >= endTime) {
      setTimeError('Start time must be earlier than end time');
      return;
    }

    // Clear any previous errors
    setTimeError('');
    setApiError('');

    setLoading(true);
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", `Bearer ${accessToken}`);

      const raw = JSON.stringify({
        "day": schedule.day,
        "schedule": {
          "start_time": startTime,
          "end_time": endTime
        }
      });

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw
      };

      const response = await fetch("http://localhost:3000/api/v1/admin/schedules/update_by_day", requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update schedule', err);
      const errorObj = err as { response?: { data?: { message?: string; error?: string } }; message?: string };

      // Get the exact error message from API response
      const apiErrorMessage = errorObj?.response?.data?.message ||
                             errorObj?.response?.data?.error ||
                             errorObj?.message ||
                             "Failed to update schedule. Please try again.";

      setApiError(apiErrorMessage);
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
              Edit Schedule
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
              <span className="font-medium text-green-700">Day:</span> {schedule.day}
            </div>
          </div>

          {/* Time Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setTimeError(''); // Clear error when user changes time
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setTimeError(''); // Clear error when user changes time
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              />
            </div>
            {timeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{timeError}</p>
              </div>
            )}
            {apiError && (
              <ErrorMessage
                message={apiError}
                onClose={() => setApiError('')}
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
              disabled={!startTime || !endTime || loading || !!timeError}
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