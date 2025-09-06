"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import SuccessMessage from '../common/Messages/Success';
import { FileText, Save, Plus, X } from "lucide-react";
import { decryptId, encryptId } from '../../common/utils/encryption';

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
  patient_name: string;
  patient_phone: string;
  treatment_type: string;
  status: string;
  is_already_registered: boolean;
}

interface PrescriptionItem {
  id?: number;
  medication: string;
  instructions: string;
  prescriptionId?: number; // For existing prescriptions
}

interface PrescriptionNoteResponse {
  id: number;
  appointment_id: number;
  prescription: string;
  details: string;
  created_at: string;
  updated_at: string;
}

export default function EditPrescription() {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    { medication: 'Treatment History', instructions: '' },
    { medication: 'Surgery', instructions: '' },
    { medication: 'Chemo', instructions: '' },
    { medication: 'Radiation', instructions: '' },
    { medication: 'Immunotherapy', instructions: '' },
    { medication: 'Others', instructions: '' },
    { medication: 'Diagnosis', instructions: '' },
    { medication: 'Instructions', instructions: '' },
    { medication: 'Final Diagnosis', instructions: '' },
    { medication: 'Advice', instructions: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDescription, setSuccessDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: number]: { medication?: string; instructions?: string }}>({});
  const [originalPrescriptionItems, setOriginalPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if appointment data was passed via navigation state
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
      setLoading(false);
      // Fetch existing prescription notes
      fetchPrescriptionNotes(location.state.appointment.id);
    } else if (id) {
      // Fetch appointment details if not passed via state
      fetchAppointmentDetails();
    }
  }, [id, location.state]);

  // Run validation whenever prescription items change
  useEffect(() => {
    if (prescriptionItems.length > 0 && !loading && appointment) {
      validatePrescriptionItems();
    }
  }, [prescriptionItems, appointment, loading]);

  const fetchAppointmentDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Decrypt the ID if it's encrypted
      const actualId = decryptId(id);

      const response = await httpService.get<{ data: Appointment }>(
        `admin/consultations/${actualId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAppointment(response.data.data);
      // Fetch existing prescription notes
      fetchPrescriptionNotes(response.data.data.id);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      setError("Failed to fetch appointment details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionNotes = async (appointmentId: number) => {
    try {
      const response = await httpService.get<{ message: string; data: PrescriptionNoteResponse[] }>(
        `admin/prescription_notes?appointment_id=${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('Fetched prescription notes:', response.data);

      if (response.data && response.data.data && response.data.data.length > 0) {
        // Map existing prescription data to our format
        const existingPrescriptions = response.data.data.map((item: PrescriptionNoteResponse) => ({
          id: item.id,
          medication: item.prescription,
          instructions: item.details,
          prescriptionId: item.id
        }));

        setPrescriptionItems(existingPrescriptions);
        setOriginalPrescriptionItems(JSON.parse(JSON.stringify(existingPrescriptions))); // Deep copy
      } else {
        // No existing prescriptions, keep default items
        const defaultItems = [
          { medication: 'Treatment History', instructions: '' },
          { medication: 'Surgery', instructions: '' },
          { medication: 'Chemo', instructions: '' },
          { medication: 'Radiation', instructions: '' },
          { medication: 'Immunotherapy', instructions: '' },
          { medication: 'Others', instructions: '' },
          { medication: 'Diagnosis', instructions: '' },
          { medication: 'Instructions', instructions: '' },
          { medication: 'Final Diagnosis', instructions: '' },
          { medication: 'Advice', instructions: '' }
        ];
        setPrescriptionItems(defaultItems);
        setOriginalPrescriptionItems(JSON.parse(JSON.stringify(defaultItems))); // Deep copy
      }
    } catch (err) {
      console.error("Error fetching prescription notes:", err);
      // If API fails, keep default items
      setPrescriptionItems([
        { medication: 'Treatment History', instructions: '' },
        { medication: 'Surgery', instructions: '' },
        { medication: 'Chemo', instructions: '' },
        { medication: 'Radiation', instructions: '' },
        { medication: 'Immunotherapy', instructions: '' },
        { medication: 'Others', instructions: '' },
        { medication: 'Diagnosis', instructions: '' },
        { medication: 'Instructions', instructions: '' },
        { medication: 'Final Diagnosis', instructions: '' },
        { medication: 'Advice', instructions: '' }
      ]);
    }
  };

  const addPrescriptionItem = () => {
    const updatedItems = [...prescriptionItems, {
      medication: '',
      instructions: ''
    }];
    setPrescriptionItems(updatedItems);
    setHasChanges(checkForChanges(updatedItems));
  };

  const removePrescriptionItem = (index: number) => {
    if (prescriptionItems.length > 1) {
      const updatedItems = prescriptionItems.filter((_, i) => i !== index);
      setPrescriptionItems(updatedItems);
      setHasChanges(checkForChanges(updatedItems));
    }
  };

  const checkForChanges = (currentItems: PrescriptionItem[]) => {
    if (originalPrescriptionItems.length === 0) return false;

    if (currentItems.length !== originalPrescriptionItems.length) {
      return true; // Different number of items
    }

    for (let i = 0; i < currentItems.length; i++) {
      const current = currentItems[i];
      const original = originalPrescriptionItems[i];

      if (!original) return true; // New item added

      // Compare medication and instructions
      if (current.medication !== original.medication || current.instructions !== original.instructions) {
        return true; // Content changed
      }
    }

    return false; // No changes
  };

  const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updatedItems = [...prescriptionItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPrescriptionItems(updatedItems);

    // Check for changes
    const hasChanged = checkForChanges(updatedItems);
    setHasChanges(hasChanged);

    // Clear validation error for this field
    if (validationErrors[index] && (field === 'medication' || field === 'instructions')) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field as keyof typeof newErrors[typeof index]];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };


  const validatePrescriptionItems = () => {
    console.log('Validating prescription items:', prescriptionItems);
    const errors: {[key: number]: { medication?: string; instructions?: string }} = {};
    let hasErrors = false;

    prescriptionItems.forEach((item, index) => {
      console.log(`Validating item ${index}:`, item);
      const itemErrors: { medication?: string; instructions?: string } = {};

      // For custom medications (index >= 10), medication name is required
      if (index >= 10 && !item.medication.trim()) {
        itemErrors.medication = 'Medication name is required';
        hasErrors = true;
      }

      // Instructions are always required for all items (including default ones)
      const trimmedInstructions = item.instructions ? item.instructions.trim() : '';
      console.log(`Item ${index} instructions: "${item.instructions}" (trimmed: "${trimmedInstructions}")`);

      if (!trimmedInstructions || trimmedInstructions.length === 0) {
        console.log(`Item ${index} has empty instructions - validation failed`);
        itemErrors.instructions = 'Description is required';
        hasErrors = true;
      } else {
        console.log(`Item ${index} has valid instructions`);
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[index] = itemErrors;
      }
    });

    console.log('Validation errors:', errors);
    console.log('Has errors:', hasErrors);
    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSave = async () => {
    console.log('Handle save called');
    console.log('Current prescription items:', prescriptionItems);

    // Validate required fields
    const isValid = validatePrescriptionItems();
    console.log('Validation result:', isValid);
    console.log('Validation errors after validation:', validationErrors);

    if (!isValid) {
      console.log('Validation failed, showing error');
      setError('Please fill in all required fields');

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Format prescription data according to API requirements
      const prescriptionData = prescriptionItems.map(item => ({
        prescription: item.medication,
        details: item.instructions
      }));

      const requestBody = {
        appointment_id: appointment?.id,
        prescription: prescriptionData
      };

      console.log('Saving prescription:', requestBody);

      // Always use POST - the API should handle creating/updating
      const response = await httpService.post(
        'admin/prescription_notes',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Prescription saved successfully:', response.data);

      setSuccessMessage('Prescription Saved');
      setSuccessDescription('The prescription has been successfully saved.');
      setShowSuccess(true);

      // Update original items to reflect the saved state
      setOriginalPrescriptionItems(JSON.parse(JSON.stringify(prescriptionItems)));
      setHasChanges(false);

      setTimeout(() => {
        if (appointment) {
          const encryptedId = encryptId(appointment.id);
          navigate(`/appointments/${encryptedId}`, { state: { appointment } });
        }
      }, 2000);
    } catch (err) {
      console.error("Error saving prescription:", err);
      setError("Failed to save prescription. Please try again.");
    } finally {
      setSaving(false);
    }
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
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Prescription</h3>
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
            <span>Edit Prescription</span>
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
                <button
                  onClick={() => {
                    if (appointment) {
                      const encryptedId = encryptId(appointment.id);
                      navigate(`/appointments/${encryptedId}`, { state: { appointment } });
                    }
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  Appointment Details
                </button>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="text-gray-500">Edit Prescription</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="w-full p-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Prescription Details
            </h2>
            <button
              onClick={addPrescriptionItem}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </button>
          </div>

          {/* Prescription Items */}
          <div className="space-y-6">
            {prescriptionItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold text-gray-900">
                     {index < 10 ? item.medication : 'Add Prescription'}
                   </h3>
                   {index >= 10 && (
                     <button
                       onClick={() => removePrescriptionItem(index)}
                       className="text-red-600 hover:text-red-800 p-1"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   )}
                 </div>

                <div className="space-y-4">
                   {index >= 10 && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name *</label>
                       <input
                         type="text"
                         value={item.medication}
                         onChange={(e) => updatePrescriptionItem(index, 'medication', e.target.value)}
                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                           validationErrors[index]?.medication ? 'border-red-500' : 'border-gray-300'
                         }`}
                         placeholder="Enter medication name"
                         required
                       />
                       {validationErrors[index]?.medication && (
                         <p className="text-red-500 text-sm mt-1">{validationErrors[index].medication}</p>
                       )}
                     </div>
                   )}
                 </div>

                <div className="mt-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Description <span className="text-red-500">*</span>
                     {index < 10 && <span className="text-xs text-gray-500 ml-1">(Required)</span>}
                   </label>
                   <textarea
                     value={item.instructions}
                     onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                     rows={3}
                     className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                       validationErrors[index]?.instructions ? 'border-red-500' : 'border-gray-300'
                     }`}
                     placeholder="Special instructions for the patient"
                     required
                   />
                   {validationErrors[index]?.instructions && (
                     <p className="text-red-500 text-sm mt-1">{validationErrors[index].instructions}</p>
                   )}
                 </div>
              </div>
            ))}
          </div>



          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  <p className="text-sm text-red-600 mt-1">Please fill in all required description fields before saving.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => {
                console.log('Cancel button clicked, appointment:', appointment);
                if (appointment) {
                  const encryptedId = encryptId(appointment.id);
                  console.log('Navigating to:', `/appointments/${encryptedId}`);
                  navigate(`/appointments/${encryptedId}`, { state: { appointment } });
                } else {
                  console.log('No appointment data, navigating to /appointments');
                  navigate('/appointments');
                }
              }}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(validationErrors).length > 0 || !hasChanges}
              className={`inline-flex items-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${
                Object.keys(validationErrors).length > 0 || !hasChanges
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {hasChanges ? 'Save Prescription' : 'No Changes'}
                </>
              )}
            </button>
          </div>
        </div>
        </div>

      <SuccessMessage
        message={successMessage}
        description={successDescription}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}