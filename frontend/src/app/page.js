'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  TrainIcon,
  ClockIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchForm.from && searchForm.to) {
      const params = new URLSearchParams({
        departure_station: searchForm.from,
        arrival_station: searchForm.to,
        travel_date: searchForm.date,
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  const features = [
    {
      name: 'Real-time Search',
      description: 'Find trains and check availability in real-time across all routes.',
      icon: MagnifyingGlassIcon,
    },
    {
      name: 'Easy Booking',
      description: 'Book your tickets in just a few clicks with our streamlined process.',
      icon: TrainIcon,
    },
    {
      name: '24/7 Service',
      description: 'Access our platform anytime, anywhere. Customer support available 24/7.',
      icon: ClockIcon,
    },
    {
      name: 'Secure Payments',
      description: 'Multiple payment options with bank-grade security and instant confirmation.',
      icon: CreditCardIcon,
    },
    {
      name: 'Trusted Platform',
      description: 'Trusted by thousands of passengers with advanced audit and provenance tracking.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Nationwide Coverage',
      description: 'Covering major cities and routes across the country with extensive network.',
      icon: GlobeAltIcon,
    },
  ];

  const stats = [
    { name: 'Cities Connected', value: '100+' },
    { name: 'Daily Trains', value: '500+' },
    { name: 'Happy Customers', value: '50K+' },
    { name: 'Years of Service', value: '10+' },
  ];

  return (
    <Layout>
      <div className="relative">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your Journey Starts Here
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-primary-100">
                Book train tickets easily with our advanced provenance-enabled management system. 
                Fast, secure, and reliable travel planning at your fingertips.
              </p>

              {/* Search Form */}
              <div className="mt-10 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-1">
                      <label htmlFor="from" className="form-label text-gray-700">
                        From
                      </label>
                      <input
                        type="text"
                        id="from"
                        className="form-input"
                        placeholder="Departure station"
                        value={searchForm.from}
                        onChange={(e) => setSearchForm({ ...searchForm, from: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="to" className="form-label text-gray-700">
                        To
                      </label>
                      <input
                        type="text"
                        id="to"
                        className="form-input"
                        placeholder="Arrival station"
                        value={searchForm.to}
                        onChange={(e) => setSearchForm({ ...searchForm, to: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label htmlFor="date" className="form-label text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        className="form-input"
                        value={searchForm.date}
                        onChange={(e) => setSearchForm({ ...searchForm, date: e.target.value })}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center"
                      >
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        Search Trains
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
                  <div className="mt-2 text-sm text-gray-600">{stat.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Why Choose Careo?
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
                Experience the future of train travel with our comprehensive booking platform
                designed for modern travelers.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="card text-center">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="bg-primary-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Ready to Start Your Journey?
                </h2>
                <p className="mt-4 text-lg text-primary-100">
                  Join thousands of satisfied customers and book your next train ticket today.
                </p>
                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign Up Now
                  </button>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Back Section for Authenticated Users */}
        {isAuthenticated && (
          <div className="bg-primary-50 border-l-4 border-primary-400 p-6 mx-4 sm:mx-6 lg:mx-8 my-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-primary-800">
                  Welcome back, {user?.full_name}!
                </h3>
                <p className="text-primary-600">
                  {user?.userType === 'admin' ? (
                    'Manage the system and view reports from your admin dashboard.'
                  ) : (
                    'Check your bookings, search for new trains, or manage your account.'
                  )}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => router.push(user?.userType === 'admin' ? '/admin/dashboard' : '/dashboard')}
                    className="btn-primary text-sm"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}