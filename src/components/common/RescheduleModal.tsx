import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import { X } from 'lucide-react';

interface Slot {
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
  available_slots: Slot[];
}

interface Appointment {
  id: number;
  patient_id: number;
  patient: {
    first_name: string;
    last_name: string;
  };
  slot_date: string | null;
  slot_time: string | null;
  is_already_registered: boolean;
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: (newDate?: string, newTime?: string) => void;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: RescheduleModalProps) {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      // Reset state when modal opens
      setSelectedDate('');
      setAvailableSlots([]);
      setSelectedSlot('');
    }
  }, [isOpen, appointment]);

  const fetchAvailableSlots = async (dateStr: string) => {
    if (!appointment) return;

    try {
      // First, make API call to get schedule data and slot duration
      const response = await httpService.get<ScheduleResponse>(
        `patients/patient_registrations/${appointment.patient_id}/check_available_schedule?date=${dateStr}&is_already_registered=false`
      );

      // Determine correct is_already_registered based on slot duration
      // If slot_duration_minutes is 20 then is_already_registered should be true
      // If slot_duration_minutes is 10 then is_already_registered should be false
      const slotDuration = response.data.slot_duration_minutes;
      const correctIsRegistered = slotDuration === 20;

      // If the appointment's current status matches what we need, use the current response
      if (appointment.is_already_registered === correctIsRegistered) {
        setAvailableSlots(response.data.available_slots);
      } else {
        // Make second call with correct is_already_registered value
        const correctResponse = await httpService.get<ScheduleResponse>(
          `patients/patient_registrations/${appointment.patient_id}/check_available_schedule?date=${dateStr}&is_already_registered=${correctIsRegistered}`
        );
        setAvailableSlots(correctResponse.data.available_slots);
      }
    } catch (err) {
      console.error('Failed to fetch slots', err);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleSaveReschedule = async () => {
    if (!appointment || !selectedDate || !selectedSlot) return;

    setLoading(true);
    try {
      const dateStr = selectedDate;
      await httpService.put(
        'admin/booked_slots/update_slot_by_appointment',
        {
          appointment_id: appointment.id,
          slot_date: dateStr,
          slot_time: selectedSlot,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      onSuccess(selectedDate, selectedSlot);
      // Close modal after a short delay to ensure success callback completes
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      console.error('Failed to reschedule', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Reschedule Appointment
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
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-2">Patient Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-green-700">Name:</span> {appointment.patient.first_name} {appointment.patient.last_name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-green-700">Slot Date:</span> {appointment.slot_date}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-green-700">Slot Time:</span> {appointment.slot_time}
              </p>
            </div>
          </div>

          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select New Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200"
              placeholder="Choose a date"
            />
          </div>

          {/* Time Slots */}
          {availableSlots.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select New Time Slot</label>
              <div className={`bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4 border border-green-100 ${
                availableSlots.length > 30 ? 'max-h-64 overflow-y-auto' : ''
              }`}>
                <div className="grid grid-cols-6 gap-2">
                  {availableSlots.map((slot, index) => (
                    <label key={index} className="flex items-center p-2 bg-white rounded-md hover:bg-green-50 cursor-pointer transition-all duration-200 border border-gray-200 hover:border-green-300 text-xs">
                      <input
                        type="radio"
                        name="slot"
                        value={`${slot.start}-${slot.end}`}
                        checked={selectedSlot === `${slot.start}-${slot.end}`}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-3 h-3 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-1"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-900">
                        {slot.start}-{slot.end}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReschedule}
              disabled={!selectedDate || !selectedSlot || loading}
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