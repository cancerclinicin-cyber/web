import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import httpService from '../../common/utils/httpService';
import Header from '../Layouts/Header/Header';
import SuccessMessage from '../common/Messages/Success';
import { FileText, Save, Plus, X, Edit, ChevronDown, ChevronUp } from "lucide-react";
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
  tab: 'treatment' | 'diagnosis';
}



interface PrescriptionNoteResponse {
  id: number;
  appointment_id: number;
  prescription: string;
  details: string;
  created_at: string;
  updated_at: string;
}

interface TreatmentHistoryResponse {
  id: number;
  patient_id: number;
  treatment_history: string;
  treatment_history_details: string;
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
    { medication: 'Treatment History', instructions: '', tab: 'treatment' },
    { medication: 'Surgery', instructions: '', tab: 'treatment' },
    { medication: 'Chemo', instructions: '', tab: 'treatment' },
    { medication: 'Radiation', instructions: '', tab: 'treatment' },
    { medication: 'Immunotherapy', instructions: '', tab: 'treatment' },
    { medication: 'Others', instructions: '', tab: 'treatment' },
    { medication: 'Diagnosis', instructions: '', tab: 'diagnosis' },
    { medication: 'Instructions', instructions: '', tab: 'diagnosis' },
    { medication: 'Final Diagnosis', instructions: '', tab: 'diagnosis' },
    { medication: 'Advice', instructions: '', tab: 'diagnosis' }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDescription, setSuccessDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: number]: { medication?: string; instructions?: string }}>({});
  const [originalPrescriptionItems, setOriginalPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [hasChanges, setHasChanges] = useState<{
    treatment: boolean;
    diagnosis: boolean;
  }>({ treatment: false, diagnosis: false });
  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState<'treatment' | 'diagnosis'>('treatment');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if appointment data was passed via navigation state
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
      setLoading(false);
      // Load prescription data (treatment histories and diagnosis)
      loadPrescriptionData(location.state.appointment.id, location.state.appointment.patient_id);
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
      // Load prescription data (treatment histories and diagnosis)
      loadPrescriptionData(response.data.data.id, response.data.data.patient_id);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      setError("Failed to fetch appointment details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentHistories = async (patientId: number) => {
    try {
      const response = await httpService.get<{ message: string; data: TreatmentHistoryResponse[] }>(
        `admin/treatment_histories?patient_id=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('Fetched treatment histories:', response.data);

      if (response.data && response.data.data && response.data.data.length > 0) {
        // Map treatment history data to our format
        const treatmentItems = response.data.data.map((item: TreatmentHistoryResponse) => ({
          id: item.id,
          medication: item.treatment_history,
          instructions: item.treatment_history_details,
          prescriptionId: item.id,
          tab: 'treatment' as const
        }));

        return treatmentItems;
      }
    } catch (err) {
      console.error("Error fetching treatment histories:", err);
    }
    return [];
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
        // Create default diagnosis items
        const defaultDiagnosisItems: PrescriptionItem[] = [
          { medication: 'Diagnosis', instructions: '', tab: 'diagnosis' },
          { medication: 'Instructions', instructions: '', tab: 'diagnosis' },
          { medication: 'Final Diagnosis', instructions: '', tab: 'diagnosis' },
          { medication: 'Advice', instructions: '', tab: 'diagnosis' }
        ];

        // Populate default items with API data based on prescription field
        const populatedItems = defaultDiagnosisItems.map(defaultItem => {
          const matchingApiItem = response.data.data.find(apiItem =>
            apiItem.prescription.toLowerCase() === defaultItem.medication.toLowerCase()
          );

          if (matchingApiItem) {
            return {
              ...defaultItem,
              id: matchingApiItem.id,
              instructions: matchingApiItem.details,
              prescriptionId: matchingApiItem.id
            };
          }

          return defaultItem;
        });

        // Add any additional custom prescription items from API that don't match defaults
        const customItems = response.data.data
          .filter(apiItem => !['diagnosis', 'instructions', 'final diagnosis', 'advice'].includes(apiItem.prescription.toLowerCase()))
          .map(apiItem => ({
            id: apiItem.id,
            medication: apiItem.prescription,
            instructions: apiItem.details,
            prescriptionId: apiItem.id,
            tab: 'diagnosis' as const
          }));

        return [...populatedItems, ...customItems];
      }
    } catch (err) {
      console.error("Error fetching prescription notes:", err);
    }

    // Return default diagnosis items if no API data
    const defaultDiagnosisItems: PrescriptionItem[] = [
      { medication: 'Diagnosis', instructions: '', tab: 'diagnosis' },
      { medication: 'Instructions', instructions: '', tab: 'diagnosis' },
      { medication: 'Final Diagnosis', instructions: '', tab: 'diagnosis' },
      { medication: 'Advice', instructions: '', tab: 'diagnosis' }
    ];
    return defaultDiagnosisItems;
  };

  const loadPrescriptionData = async (appointmentId: number, patientId: number) => {
    try {
      // Fetch both treatment histories and prescription notes in parallel
      const [treatmentItems, diagnosisItems] = await Promise.all([
        fetchTreatmentHistories(patientId),
        fetchPrescriptionNotes(appointmentId)
      ]);

      // Combine treatment and diagnosis items
      const allItems = [...treatmentItems, ...diagnosisItems];

      if (allItems.length > 0) {
        setPrescriptionItems(allItems);
        setOriginalPrescriptionItems(JSON.parse(JSON.stringify(allItems))); // Deep copy
      } else {
        // No existing data, use default items
        const defaultTreatmentItems = [
          { medication: 'Treatment History', instructions: '', tab: 'treatment' as const },
          { medication: 'Surgery', instructions: '', tab: 'treatment' as const },
          { medication: 'Chemo', instructions: '', tab: 'treatment' as const },
          { medication: 'Radiation', instructions: '', tab: 'treatment' as const },
          { medication: 'Immunotherapy', instructions: '', tab: 'treatment' as const },
          { medication: 'Others', instructions: '', tab: 'treatment' as const }
        ];

        const defaultDiagnosisItems = [
          { medication: 'Diagnosis', instructions: '', tab: 'diagnosis' as const },
          { medication: 'Instructions', instructions: '', tab: 'diagnosis' as const },
          { medication: 'Final Diagnosis', instructions: '', tab: 'diagnosis' as const },
          { medication: 'Advice', instructions: '', tab: 'diagnosis' as const }
        ];

        const defaultItems = [...defaultTreatmentItems, ...defaultDiagnosisItems];
        setPrescriptionItems(defaultItems);
        setOriginalPrescriptionItems(JSON.parse(JSON.stringify(defaultItems))); // Deep copy
      }
    } catch (err) {
      console.error("Error loading prescription data:", err);
      // If API fails, keep default items
      const defaultTreatmentItems: PrescriptionItem[] = [
        { medication: 'Treatment History', instructions: '', tab: 'treatment' },
        { medication: 'Surgery', instructions: '', tab: 'treatment' },
        { medication: 'Chemo', instructions: '', tab: 'treatment' },
        { medication: 'Radiation', instructions: '', tab: 'treatment' },
        { medication: 'Immunotherapy', instructions: '', tab: 'treatment' },
        { medication: 'Others', instructions: '', tab: 'treatment' }
      ];

      const defaultDiagnosisItems: PrescriptionItem[] = [
        { medication: 'Diagnosis', instructions: '', tab: 'diagnosis' },
        { medication: 'Instructions', instructions: '', tab: 'diagnosis' },
        { medication: 'Final Diagnosis', instructions: '', tab: 'diagnosis' },
        { medication: 'Advice', instructions: '', tab: 'diagnosis' }
      ];

      const defaultItems = [...defaultTreatmentItems, ...defaultDiagnosisItems];
      setPrescriptionItems(defaultItems);
    }
  };

  const addPrescriptionItem = (tab: 'treatment' | 'diagnosis') => {
    const updatedItems = [...prescriptionItems, {
      medication: '',
      instructions: '',
      tab
    }];
    setPrescriptionItems(updatedItems);
    setHasChanges((prev) => ({
      ...prev,
      [tab]: checkForChanges(updatedItems, tab),
    }));
  };

  const toggleCardExpansion = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const removePrescriptionItem = (index: number) => {
    if (prescriptionItems.length > 1) {
      const updatedItems = prescriptionItems.filter((_, i) => i !== index);
      setPrescriptionItems(updatedItems);
      const tab = prescriptionItems[index].tab;
      setHasChanges((prev) => ({
        ...prev,
        [tab]: checkForChanges(updatedItems, tab),
      }));
    }
  };

  const checkForChanges = (currentItems: PrescriptionItem[], tab: 'treatment' | 'diagnosis') => {
    const currentTabItems = currentItems.filter((item) => item.tab === tab);
    const originalTabItems = originalPrescriptionItems.filter((item) => item.tab === tab);

    if (currentTabItems.length !== originalTabItems.length) {
      return true; // Different number of items
    }

    for (let i = 0; i < currentTabItems.length; i++) {
      const current = currentTabItems[i];
      const original = originalTabItems[i];

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

    // Check for changes in the specific tab
    const tab = updatedItems[index].tab;
    const hasChanged = checkForChanges(updatedItems, tab);
    setHasChanges((prev) => ({ ...prev, [tab]: hasChanged }));

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

      // For custom medications (not default ones), medication name is required
      const isDefaultItem = ['Treatment History', 'Surgery', 'Chemo', 'Radiation', 'Immunotherapy', 'Others', 'Diagnosis', 'Instructions', 'Final Diagnosis', 'Advice'].includes(item.medication);
      if (!isDefaultItem && !item.medication.trim()) {
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

  const handleSaveTreatment = async () => {
    console.log('Handle save treatment called');

    // Validate required fields for treatment items only
    const isValid = validatePrescriptionItemsForTab('treatment');

    if (!isValid) {
      setError('Please fill in all required fields for treatment history');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Format treatment data according to the new API format
      const treatmentItems = prescriptionItems.filter(item => item.tab === 'treatment');
      const treatmentData = treatmentItems.map(item => ({
        treatment_history: item.medication,
        treatment_history_details: item.instructions
      }));

      const requestBody = {
        patient_id: appointment?.patient_id,
        treatment_history: treatmentData
      };

      console.log('Saving treatment history:', requestBody);

      // Use the new treatment_histories endpoint
      await httpService.post(
        'admin/treatment_histories',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Treatment history saved successfully');

      setSuccessMessage('Treatment History Saved');
      setSuccessDescription('The treatment history has been successfully saved.');
      setShowSuccess(true);

      // Update original items to reflect the saved state
      setOriginalPrescriptionItems(JSON.parse(JSON.stringify(prescriptionItems)));
      setHasChanges(prev => ({ ...prev, treatment: false }));

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error saving treatment history:", err);
      setError("Failed to save treatment history. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDiagnosis = async () => {
    console.log('Handle save diagnosis called');

    // Validate required fields for diagnosis items only
    const isValid = validatePrescriptionItemsForTab('diagnosis');

    if (!isValid) {
      setError('Please fill in all required fields for diagnosis');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Format diagnosis data according to the API format
      const diagnosisItems = prescriptionItems.filter(item => item.tab === 'diagnosis');
      const diagnosisData = diagnosisItems.map(item => ({
        prescription: item.medication,
        details: item.instructions
      }));

      const requestBody = {
        appointment_id: appointment?.id,
        prescription: diagnosisData
      };

      console.log('Saving diagnosis:', requestBody);

      await httpService.post(
        'admin/prescription_notes',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Diagnosis saved successfully');

      setSuccessMessage('Diagnosis Saved');
      setSuccessDescription('The diagnosis has been successfully saved.');
      setShowSuccess(true);

      // Update original items to reflect the saved state
      setOriginalPrescriptionItems(JSON.parse(JSON.stringify(prescriptionItems)));
      setHasChanges({ treatment: false, diagnosis: false });

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error saving diagnosis:", err);
      setError("Failed to save diagnosis. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasValidationErrorsInTab = (tab: 'treatment' | 'diagnosis') => {
    return prescriptionItems.some((item, index) => item.tab === tab && validationErrors[index]);
  };

  const validatePrescriptionItemsForTab = (tab: 'treatment' | 'diagnosis') => {
    const tabItems = prescriptionItems.filter(item => item.tab === tab);
    const errors: {[key: number]: { medication?: string; instructions?: string }} = {};
    let hasErrors = false;

    tabItems.forEach((item, index) => {
      const itemErrors: { medication?: string; instructions?: string } = {};

      // For custom medications (not default ones), medication name is required
      const isDefaultItem = [
        'Treatment History', 'Surgery', 'Chemo', 'Radiation', 'Immunotherapy', 'Others',
        'Diagnosis', 'Instructions', 'Final Diagnosis', 'Advice'
      ].includes(item.medication);

      if (!isDefaultItem && !item.medication.trim()) {
        itemErrors.medication = 'Medication name is required';
        hasErrors = true;
      }

      // Instructions are always required
      const trimmedInstructions = item.instructions ? item.instructions.trim() : '';
      if (!trimmedInstructions || trimmedInstructions.length === 0) {
        itemErrors.instructions = 'Description is required';
        hasErrors = true;
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[index] = itemErrors;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
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
            <div className="flex space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('treatment')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'treatment'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Treatment History
                </button>
                <button
                  onClick={() => setActiveTab('diagnosis')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'diagnosis'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Diagnosis
                </button>
              </nav>
            </div>
          </div>

          {/* Prescription Items */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === 'treatment' ? 'Treatment History' : 'Diagnosis'}
              </h3>
            </div>
            <div className="space-y-4">
              {prescriptionItems.map((item, globalIndex) => item.tab === activeTab && (
                  <div key={globalIndex} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleCardExpansion(globalIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.medication || 'Add Prescription'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {item.medication !== 'Treatment History' &&
                         item.medication !== 'Surgery' &&
                         item.medication !== 'Chemo' &&
                         item.medication !== 'Radiation' &&
                         item.medication !== 'Immunotherapy' &&
                         item.medication !== 'Others' &&
                         item.medication !== 'Diagnosis' &&
                         item.medication !== 'Instructions' &&
                         item.medication !== 'Final Diagnosis' &&
                         item.medication !== 'Advice' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePrescriptionItem(globalIndex);
                            }}
                            disabled={!isEditing}
                            className={`p-1 ${isEditing ? 'text-red-600 hover:text-red-800' : 'text-gray-400 cursor-not-allowed'}`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                        {expandedCards.has(globalIndex) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {expandedCards.has(globalIndex) && (
                      <div className="px-6 pb-6">
                        <div className="space-y-4">
                          {!['Treatment History', 'Surgery', 'Chemo', 'Radiation', 'Immunotherapy', 'Others', 'Diagnosis', 'Instructions', 'Final Diagnosis', 'Advice'].includes(item.medication) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name *</label>
                              <input
                                type="text"
                                value={item.medication}
                                onChange={(e) => updatePrescriptionItem(globalIndex, 'medication', e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  validationErrors[globalIndex]?.medication ? 'border-red-500' : 'border-gray-300'
                                } ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Enter medication name"
                                required
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={item.instructions}
                            onChange={(e) => updatePrescriptionItem(globalIndex, 'instructions', e.target.value)}
                            rows={3}
                            disabled={!isEditing}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              validationErrors[globalIndex]?.instructions ? 'border-red-500' : 'border-gray-300'
                            } ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Special instructions for the patient"
                            required
                          />
                          {validationErrors[globalIndex]?.instructions && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors[globalIndex].instructions}</p>
                          )}
                        </div>
                      </div>
                    )}
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
              onClick={() => addPrescriptionItem(activeTab)}
              disabled={!isEditing}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isEditing
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'treatment' ? 'Treatment' : 'Diagnosis'}
            </button>
            <button
              onClick={activeTab === 'treatment' ? handleSaveTreatment : handleSaveDiagnosis}
              disabled={saving || hasValidationErrorsInTab(activeTab) || !isEditing || !hasChanges[activeTab]}
              className={`inline-flex items-center px-6 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${
                hasValidationErrorsInTab(activeTab) || !isEditing || !hasChanges[activeTab]
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
                  Save {activeTab === 'treatment' ? 'Treatment' : 'Diagnosis'}
                </>
              )}
            </button>
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
    </div>
  );
}
