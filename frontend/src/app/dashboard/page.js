'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import Layout from '../../components/Layout/Layout';
import Card, { StatsCard, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import Badge, { BookingStatusBadge, PaymentStatusBadge } from '../../components/UI/Badge';
import { FullPageSpinner } from '../../components/UI/LoadingSpinner';
import { NoBookings } from '../../components/UI/EmptyState';
import { reservationsApi, paymentsApi } from '../../services/api';
import {
  TicketIcon,
  CreditCardIcon,
  CalendarIcon,
  ArrowRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a passenger
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== 'passenger')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Fetch user's bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery(
    'user-bookings',
    () => reservationsApi.getAll({ limit: 5 }),
    {
      enabled: isAuthenticated && user?.userType === 'passenger',
      select: data => data.data,
    }
  );

  // Fetch user's payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    'user-payments',
    () => paymentsApi.getAll({ limit: 5 }),
    {
      enabled: isAuthenticated && user?.userType === 'passenger',
      select: data => data.data,
    }
  );

  if (isLoading) {
    return <FullPageSpinner message="Loading dashboard..." />;
  }

  if (!isAuthenticated || user?.userType !== 'passenger') {
    return null;
  }

  const bookings = bookingsData?.data || [];
  const payments = paymentsData?.data || [];

  // Calculate stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.BOOKING_STATUS === 'CONFIRMED').length;
  const totalSpent = payments
    .filter(p => p.PAYMENT_STATUS === 'COMPLETED')
    .reduce((sum, p) => sum + (p.AMOUNT || 0), 0);
  const pendingPayments = payments.filter(p => p.PAYMENT_STATUS === 'PENDING').length;

  const upcomingTrips = bookings.filter(booking => {
    const departureTime = new Date(booking.DEPARTURE_TIME);
    return departureTime > new Date() && booking.BOOKING_STATUS === 'CONFIRMED';
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg">
          <div className="px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="mt-2 text-primary-100">
              Here's an overview of your travel activity and upcoming journeys.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Bookings"
            value={totalBookings}
            icon={TicketIcon}
          />
          <StatsCard
            title="Confirmed Trips"
            value={confirmedBookings}
            icon={CalendarIcon}
          />
          <StatsCard
            title="Total Spent"
            value={`৳${totalSpent.toLocaleString()}`}
            icon={CreditCardIcon}
          />
          <StatsCard
            title="Pending Payments"
            value={pendingPayments}
            icon={CreditCardIcon}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Trips</CardTitle>
                <button
                  onClick={() => router.push('/search')}
                  className="btn-primary text-sm flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Book New Trip
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTrips.length === 0 ? (
                <NoBookings onBook={() => router.push('/search')} />
              ) : (
                <div className="space-y-4">
                  {upcomingTrips.slice(0, 3).map((booking) => (
                    <div
                      key={booking.RESERVATION_ID}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/bookings/${booking.RESERVATION_ID}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-600">T</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.DEPARTURE_STATION} → {booking.ARRIVAL_STATION}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.TRAIN_NAME} • {format(parseISO(booking.DEPARTURE_TIME), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookingStatusBadge status={booking.BOOKING_STATUS} />
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}

                  {upcomingTrips.length > 3 && (
                    <button
                      onClick={() => router.push('/bookings')}
                      className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View all bookings
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <button
                  onClick={() => router.push('/bookings')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <NoBookings onBook={() => router.push('/search')} />
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.RESERVATION_ID}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/bookings/${booking.RESERVATION_ID}`)}
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
                            {booking.BOOKING_REFERENCE}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookingStatusBadge status={booking.BOOKING_STATUS} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Payments</CardTitle>
                <button
                  onClick={() => router.push('/payments')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-6">
                  <CreditCardIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-600">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.PAYMENT_ID}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/payments/${payment.PAYMENT_ID}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ৳{payment.AMOUNT?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payment.BOOKING_REFERENCE}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <PaymentStatusBadge status={payment.PAYMENT_STATUS} size="sm" />
                        <p className="text-xs text-gray-600 mt-1">
                          {format(parseISO(payment.PAYMENT_DATE), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  onClick={() => router.push('/search')}
                  className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-primary-600">T</span>
                    <span className="font-medium text-primary-900">Search Trains</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-primary-600" />
                </button>

                <button
                  onClick={() => router.push('/bookings')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <TicketIcon className="h-6 w-6 text-gray-600" />
                    <span className="font-medium text-gray-900">My Bookings</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>

                <button
                  onClick={() => router.push('/payments')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCardIcon className="h-6 w-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Payments</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>

                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-gray-900">Profile Settings</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
