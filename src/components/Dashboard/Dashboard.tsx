"use client";

import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Calendar, Users, CalendarDays, TrendingUp, Plus, Clock,
  DollarSign, Activity, CheckCircle
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

  // Calculate percentage changes (mock data for now)
  const patientChange = "+12.5";
  const appointmentChange = "+8.3";
  const revenueChange = "+15.2";

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
      <main className="flex-1 p-4 md:p-8 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* Enhanced Filters */}
          <div className="flex flex-wrap gap-4 mb-8 items-center bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-gray-700 font-semibold text-lg">Filter by:</span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>

          </div>
          
          {/* Enhanced Medical Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center gap-3 text-blue-700 mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Total Patients</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 my-3">{stats.totalPatients}</h3>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{patientChange}% this month</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center gap-3 text-green-700 mb-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Today's Appointments</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 my-3">{stats.todaysAppointments}</h3>
                <div className="flex items-center text-sm font-medium text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Scheduled today</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center gap-3 text-purple-700 mb-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Completed This Month</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 my-3">{stats.completedAppointments}</h3>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{appointmentChange}% from last month</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center gap-3 text-amber-700 mb-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">Monthly Revenue</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 my-3">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{revenueChange}% from last month</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Trends Chart */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Trends
                </h2>
                <p className="text-sm text-blue-100 mt-1">Patient registrations and appointments</p>
              </div>
              <div className="p-6">
                <div className="h-80">
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

            {/* Today's Schedule */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-green-200 bg-gradient-to-r from-green-500 to-green-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Schedule
                </h2>
                <p className="text-sm text-green-100 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {todaysSchedule.length > 0 ? todaysSchedule.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(appointment.patient_name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient_name || 'Unknown Patient'}</p>
                          <p className="text-sm text-gray-500">{appointment.slot_time || 'N/A'}</p>
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
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No appointments scheduled for today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Appointments */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-500 to-purple-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Appointments
                </h2>
                <p className="text-sm text-purple-100 mt-1">Latest patient consultations</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentAppointments.length > 0 ? recentAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(appointment.patient?.first_name || 'U').charAt(0)}{(appointment.patient?.last_name || '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient?.first_name || 'Unknown'} {appointment.patient?.last_name || ''}</p>
                          <p className="text-sm text-gray-500">{appointment.slot_date ? new Date(appointment.slot_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{(appointment.amount || 0).toLocaleString()}</p>
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
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-500 to-orange-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Overview
                </h2>
                <p className="text-sm text-amber-100 mt-1">Monthly revenue trends</p>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #f59e0b',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}