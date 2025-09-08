'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from 'react-query';
import Layout from '../../../components/Layout/Layout';
import Card, { StatsCard, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/UI/Card';
import Badge, { BookingStatusBadge, PaymentStatusBadge, TrainStatusBadge } from '../../../components/UI/Badge';
import { FullPageSpinner } from '../../../components/UI/LoadingSpinner';
import { adminApi } from '../../../services/api';
import {
  UsersIcon,
  TrainIcon,
  TicketIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== 'admin')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'admin-dashboard',
    () => adminApi.getDashboard(),
    {
      enabled: isAuthenticated && user?.userType === 'admin',
      select: data => data.data.data,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading || dashboardLoading) {
    return <FullPageSpinner message="Loading admin dashboard..." />;
  }

  if (!isAuthenticated || user?.userType !== 'admin') {
    return null;
  }

  const stats = dashboardData || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg">
          <div className="px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-primary-100">
                  Monitor and manage the train ticket management system
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary-200 text-sm">Welcome back,</p>
                <p className="text-xl font-semibold">{user?.full_name}</p>
                <Badge variant="info" className="mt-1 bg-white/20 text-white border-white/30">
                  {user?.role || 'Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Passengers"
            value={stats.totalPassengers?.toLocaleString() || '0'}
            icon={UsersIcon}
            change="+12%"
            changeType="positive"
          />
          <StatsCard
            title="Active Trains"
            value={stats.totalTrains?.toLocaleString() || '0'}
            icon={TrainIcon}
          />
          <StatsCard
            title="Total Reservations"
            value={stats.totalReservations?.toLocaleString() || '0'}
            icon={TicketIcon}
            change="+8%"
            changeType="positive"
          />
          <StatsCard
            title="Total Revenue"
            value={`৳${stats.totalRevenue?.toLocaleString() || '0'}`}
            icon={CreditCardIcon}
            change="+15%"
            changeType="positive"
          />
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TicketIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-blue-900">
                  {stats.todayBookings?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-blue-700">Today's Bookings</div>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CreditCardIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-green-900">
                  ৳{stats.todayRevenue?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-green-700">Today's Revenue</div>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-yellow-900">
                  {stats.pendingPayments?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-yellow-700">Pending Payments</div>
              </div>
            </div>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-semibold text-red-900">
                  {stats.cancelledBookings?.toLocaleString() || '0'}
                </div>
                <div className="text-sm font-medium text-red-700">Cancelled Bookings</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <button
                  onClick={() => router.push('/admin/bookings')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking) => (
                    <div
                      key={booking.RESERVATION_ID}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/admin/bookings/${booking.RESERVATION_ID}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <TicketIcon className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.DEPARTURE_STATION} → {booking.ARRIVAL_STATION}
                          </p>
                          <p className="text-xs text-gray-600">
                            {booking.PASSENGER_NAME} • {booking.BOOKING_REFERENCE}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{booking.TRAIN_NAME}</p>
                        <p className="text-xs text-gray-600">
                          {format(parseISO(booking.BOOKING_DATE), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <TicketIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-600">No recent bookings</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Routes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Popular Routes</CardTitle>
                <button
                  onClick={() => router.push('/admin/reports/routes')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View reports
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.popularRoutes && stats.popularRoutes.length > 0 ? (
                <div className="space-y-4">
                  {stats.popularRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {route.DEPARTURE_STATION} → {route.ARRIVAL_STATION}
                          </p>
                          <p className="text-xs text-gray-600">Popular route</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {route.BOOKING_COUNT} bookings
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-600">No route data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => router.push('/admin/trains')}
                  className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <TrainIcon className="h-6 w-6 text-primary-600" />
                    <span className="font-medium text-primary-900">Manage Trains</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-primary-600" />
                </button>
                
                <button
                  onClick={() => router.push('/admin/schedules')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-6 w-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Schedules</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>
                
                <button
                  onClick={() => router.push('/admin/users')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="h-6 w-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Manage Users</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>
                
                <button
                  onClick={() => router.push('/admin/audit')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-900">Audit Trail</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">Database</span>
                  </div>
                  <span className="text-xs text-green-700">Operational</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">API Services</span>
                  </div>
                  <span className="text-xs text-green-700">All Good</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-900">Payment Gateway</span>
                  </div>
                  <span className="text-xs text-green-700">Connected</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-900">Backup Status</span>
                  </div>
                  <span className="text-xs text-yellow-700">Last: 2 hours ago</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <button
                onClick={() => router.push('/admin/system')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View detailed status →
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
