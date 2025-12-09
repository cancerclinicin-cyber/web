"use client";

import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Calendar, Users, CalendarDays, TrendingUp, Plus, Clock,
  Activity
} from "lucide-react";
import Header from "../Layouts/Header/Header";
import httpService from '../../common/utils/httpService';

// Types for dashboard data
interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  averageAppointmentValue: number;
}

interface RecentAppointment {
  id: number;
  patient_name: string;
  slot_date: string;
  slot_time: string;
  appointment_status: string;
  amount: number;
  patient: {
    first_name: string;
    last_name: string;
  };
}

interface TodaysSchedule {
  id: number;
  patient_name: string;
  slot_time: string;
  appointment_status: string;
  treatment_type?: string;
}

interface ApiResponse<T> {
  data: T;
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  current_count: number;
}

interface MonthlyDataItem {
  month: string;
  patients: number;
  appointments: number;
  revenue: number;
}

interface MonthlyDataResponse {
  data: MonthlyDataItem[];
  year: number;
}

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
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('normal-schedule');
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todaysAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    averageAppointmentValue: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<TodaysSchedule[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await httpService.get('admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStats(statsResponse.data as DashboardStats);

      // Fetch recent appointments
      const appointmentsResponse = await httpService.get<ApiResponse<RecentAppointment[]>>('admin/consultations?per_page=5&sort_by=created_at&sort_dir=desc', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setRecentAppointments(appointmentsResponse.data.data || []);

      // Fetch today's schedule
      const today = new Date().toISOString().split('T')[0];
      const scheduleResponse = await httpService.get<ApiResponse<TodaysSchedule[]>>(`admin/consultations?slot_date=${today}&per_page=10`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setTodaysSchedule(scheduleResponse.data.data || []);

      // Fetch monthly data for charts
      const monthlyResponse = await httpService.get<MonthlyDataResponse>(`admin/dashboard/monthly_data?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMonthlyData(monthlyResponse.data.data || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
    }
  }, [accessToken, selectedYear]);


  // Year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Top Navigation Bar with Green Background */}
      <Header />

      {/* Mobile Menu */}
      <div className="md:hidden bg-green-700 border-t border-green-600 relative z-10">
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
      <main className="flex-1 p-3 md:p-6 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* Compact Filter in Top Right */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-md border border-gray-200">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-gray-700 font-medium text-sm">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Enhanced Medical Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold">Total Patients</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{stats.totalPatients}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold">Today's Appointments</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 my-2">{stats.todaysAppointments}</h3>
              </div>
            </div>
          </div>
          
          {/* Full Width Monthly Trends Chart */}
          <div className="mb-4">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Trends
                </h2>
                <p className="text-sm text-blue-100 mt-1">Patient registrations and appointments</p>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #3b82f6',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="patients" fill="#3b82f6" name="Patients" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="appointments" fill="#10b981" name="Appointments" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Schedule and Recent Appointments in Single Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's Schedule */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-4 border-b border-green-200 bg-gradient-to-r from-green-500 to-green-600">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Today's Schedule
                </h2>
                <p className="text-xs text-green-100 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="p-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {todaysSchedule.length > 0 ? todaysSchedule.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {(appointment.patient_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{appointment.patient_name || 'Unknown Patient'}</p>
                          <p className="text-xs text-gray-500">{appointment.slot_time || 'N/A'}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.appointment_status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.appointment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.appointment_status}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No appointments scheduled for today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-500 to-purple-600">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Appointments
                </h2>
                <p className="text-xs text-purple-100 mt-1">Latest patient consultations</p>
              </div>
              <div className="p-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentAppointments.length > 0 ? recentAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {(appointment.patient?.first_name || 'U').charAt(0)}{(appointment.patient?.last_name || '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{appointment.patient?.first_name || 'Unknown'} {appointment.patient?.last_name || ''}</p>
                          <p className="text-xs text-gray-500">{appointment.slot_date ? new Date(appointment.slot_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">₹{(appointment.amount || 0).toLocaleString()}</p>
                        <p className={`text-xs px-2 py-1 rounded-full ${
                          appointment.appointment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                          appointment.appointment_status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.appointment_status}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No recent appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}