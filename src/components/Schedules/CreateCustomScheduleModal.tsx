import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import { X } from 'lucide-react';

interface CreateCustomScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCustomScheduleModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCustomScheduleModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState('');

  const handleSave = async () => {
    if (!scheduledDate || !startTime || !endTime) return;

    // Validate time range before saving
    if (!validateTimeRange(startTime, endTime)) return;

    setLoading(true);
    try {
      // Calculate duration
      const startDateTime = new Date(`${scheduledDate}T${startTime}`);
      const endDateTime = new Date(`${scheduledDate}T${endTime}`);
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      await httpService.post(
        'admin/schedules',
        {
          schedule: {
            scheduled_date: scheduledDate,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            duration_hr: durationHours,
            duration_min: durationMinutes,
            status: true
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      onSuccess();
      // Reset form
      setScheduledDate('');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      console.error('Failed to create schedule', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setScheduledDate('');
    setStartTime('');
    setEndTime('');
    setTimeError('');
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Create Custom Schedule
            </h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
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
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleClose}
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
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}