"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, User } from "lucide-react";

// Define patient data type based on API response
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
  last_appointment_date: string | null;
}

// Define API response structure
interface ApiResponse {
  data: Patient[];
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  current_count: number;
}

export default function PatientListing() {
  // State management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch patients from API
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would get the token from your auth store
      // For now, we'll use the hardcoded token from your example
      const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZG1pbl91c2VyX2lkIjozLCJleHAiOjE3NTcxNzI1Mjl9.tbQ6V8Y3aiPHYnmoR9Xhrejck4NXKPNbETxLN_bVszo";
      
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);
      
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };
      
      const response = await fetch(
        `http://localhost:3000/api/v1/admin/patients?page=${currentPage}&per_page=${itemsPerPage}&sort_by=created_at&sort_dir=desc&search=${searchTerm}`,
        requestOptions
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      
      setPatients(result.data);
      setTotalCount(result.total_count);
      setTotalPages(result.total_pages);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to fetch patients. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients when dependencies change
  useEffect(() => {
    fetchPatients();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Sort patients based on sort configuration
  const sortedPatients = useMemo(() => {
    if (!sortConfig) return patients;
    
    return [...patients].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [patients, sortConfig]);

  // Handle sorting
  const requestSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
            <h3 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Patients</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={fetchPatients}
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

  // Render patient list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Patient Management</h1>
          <p className="text-gray-600">Manage and view all patient records</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name or ID..."
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

        {/* Patient Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Patient
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => requestSort('age')}
                  >
                    <div className="flex items-center">
                      Age
                      {sortConfig?.key === 'age' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Gender
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => requestSort('last_appointment_date')}
                  >
                    <div className="flex items-center">
                      Last Visit
                      {sortConfig?.key === 'last_appointment_date' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Patient ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPatients.length > 0 ? (
                  sortedPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl w-10 h-10 flex items-center justify-center text-white font-bold">
                            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.age || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {patient.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(patient.last_appointment_date || patient.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {patient.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {patient.code}
                        </span>
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
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
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
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> patients
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
    </div>
  );
}