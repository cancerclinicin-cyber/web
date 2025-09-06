"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Calendar, Users, CalendarDays, TrendingUp,
  Plus
} from "lucide-react";
import Header from "../Layouts/Header/Header";

// Mock data for charts
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Current year data (2024)
  const currentYearData = months.map((month) => ({
    month,
    patients: Math.floor(Math.random() * 40) + 30,
    appointments: Math.floor(Math.random() * 80) + 80
  }));

  // Previous year data (2023)
  const previousYearData = months.map((month) => ({
    month,
    patients: Math.floor(Math.random() * 30) + 20,
    appointments: Math.floor(Math.random() * 60) + 60
  }));

  return { currentYearData, previousYearData };
};

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { 
    id: 'schedule', 
    label: 'Schedule', 
    icon: Plus,
    subItems: [
      { id: 'normal-schedule', label: 'Normal Schedule' },
      { id: 'custom-schedule', label: 'Custom Schedule' }
    ]
  },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
];


export default function OncologistDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('normal-schedule');
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);
  
  const { currentYearData, previousYearData } = generateMonthlyData();
  
  // Calculate totals for current year
  const currentTotalPatients = currentYearData.reduce((sum, month) => sum + month.patients, 0);
  const currentTotalAppointments = currentYearData.reduce((sum, month) => sum + month.appointments, 0);
  
  // Calculate totals for previous year
  const previousTotalPatients = previousYearData.reduce((sum, month) => sum + month.patients, 0);
  const previousTotalAppointments = previousYearData.reduce((sum, month) => sum + month.appointments, 0);
  
  // Calculate percentage changes
  const patientChange = (((currentTotalPatients - previousTotalPatients) / previousTotalPatients) * 100).toFixed(1);
  const appointmentChange = (((currentTotalAppointments - previousTotalAppointments) / previousTotalAppointments) * 100).toFixed(1);
  
  // Year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar with Green Background */}
      <Header />

      {/* Mobile Menu */}
      <div className="md:hidden bg-green-700 border-t border-green-600">
        <div className="flex overflow-x-auto py-2 px-2 space-x-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.subItems) {
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'schedule') {
                        setIsScheduleMenuOpen(!isScheduleMenuOpen);
                      } else {
                        setIsScheduleMenuOpen(false);
                      }
                    }}
                    className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                      activeTab === item.id 
                        ? 'bg-green-800 text-white' 
                        : 'text-green-100 hover:bg-green-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    <span>{item.label}</span>
                  </button>
                  
                  {isScheduleMenuOpen && item.id === 'schedule' && (
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActiveSubTab(subItem.id);
                            setIsScheduleMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            activeSubTab === subItem.id
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsScheduleMenuOpen(false);
                }}
                className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  activeTab === item.id 
                    ? 'bg-green-800 text-white' 
                    : 'text-green-100 hover:bg-green-600'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Patient growth and appointment trends</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-center bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700 font-medium">Filter by:</span>
            </div>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            
            <button className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Export Report
            </button>
          </div>
          
          {/* Stats Cards without colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Users className="h-5 w-5" />
                  <p className="text-sm font-medium">Total Patients (2024)</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{currentTotalPatients}</h3>
                <div className={`flex items-center text-sm ${parseFloat(patientChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{patientChange}% from 2023</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CalendarDays className="h-5 w-5" />
                  <p className="text-sm font-medium">Appointments (2024)</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{currentTotalAppointments}</h3>
                <div className={`flex items-center text-sm ${parseFloat(appointmentChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{appointmentChange}% from 2023</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Users className="h-5 w-5" />
                  <p className="text-sm font-medium">Avg. Patients/Month</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{Math.round(currentTotalPatients / 12)}</h3>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+12% from 2023</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <CalendarDays className="h-5 w-5" />
                  <p className="text-sm font-medium">Avg. Appointments/Month</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{Math.round(currentTotalAppointments / 12)}</h3>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+15% from 2023</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Monthly Patient Registration Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Patient Registrations</h2>
              <p className="text-sm text-gray-500">Comparison of patient registrations for 2023 vs 2024</p>
            </div>
            <div className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentYearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="patients" fill="#3b82f6" name="2024 Patients" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Monthly Appointment Booking Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Appointment Bookings</h2>
              <p className="text-sm text-gray-500">Comparison of appointment bookings for 2023 vs 2024</p>
            </div>
            <div className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentYearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.5rem' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="appointments" fill="#10b981" name="2024 Appointments" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}