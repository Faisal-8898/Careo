'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'react-query';
import Layout from '../../components/Layout/Layout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import Badge, { TrainStatusBadge } from '../../components/UI/Badge';
import { InlineSpinner } from '../../components/UI/LoadingSpinner';
import { NoSearchResults } from '../../components/UI/EmptyState';
import { schedulesApi, stationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  TrainIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
  CalendarIcon,
  BanknotesIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Initialize search form with URL params
  const [searchForm, setSearchForm] = useState({
    departure_station: searchParams.get('departure_station') || '',
    arrival_station: searchParams.get('arrival_station') || '',
    travel_date: searchParams.get('travel_date') || format(new Date(), 'yyyy-MM-dd'),
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if URL params are present
  useEffect(() => {
    if (searchForm.departure_station && searchForm.arrival_station) {
      handleSearch();
    }
  }, []); // Only run on mount

  // Fetch stations for autocomplete
  const { data: stationsData } = useQuery(
    'stations',
    () => stationsApi.getAll({ limit: 100 }),
    {
      select: data => data.data.data || [],
    }
  );

  const stations = stationsData || [];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    if (!searchForm.departure_station || !searchForm.arrival_station) {
      toast.error('Please select departure and arrival stations');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await schedulesApi.search(searchForm);
      setSearchResults(response.data.data || []);
      
      // Update URL with search params
      const params = new URLSearchParams(searchForm);
      router.push(`/search?${params.toString()}`);
    } catch (error) {
      toast.error('Failed to search trains. Please try again.');
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBooking = (schedule) => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      router.push('/auth/login');
      return;
    }
    
    // Navigate to booking page with schedule details
    router.push(`/book?schedule_id=${schedule.SCHEDULE_ID}`);
  };

  const formatTime = (timeString) => {
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (timeString) => {
    try {
      return format(parseISO(timeString), 'MMM dd, yyyy');
    } catch (error) {
      return timeString;
    }
  };

  const calculateDuration = (departureTime, arrivalTime) => {
    try {
      const dept = new Date(departureTime);
      const arr = new Date(arrivalTime);
      const diffInMinutes = (arr - dept) / (1000 * 60);
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-primary-600" />
              Search Trains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label htmlFor="departure_station" className="form-label">
                  From
                </label>
                <input
                  type="text"
                  id="departure_station"
                  className="form-input"
                  placeholder="Departure station"
                  value={searchForm.departure_station}
                  onChange={(e) => setSearchForm({ ...searchForm, departure_station: e.target.value })}
                  list="departure-stations"
                  required
                />
                <datalist id="departure-stations">
                  {stations.map((station) => (
                    <option key={station.STATION_ID} value={station.STATION_NAME}>
                      {station.STATION_NAME} ({station.STATION_CODE})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="arrival_station" className="form-label">
                  To
                </label>
                <input
                  type="text"
                  id="arrival_station"
                  className="form-input"
                  placeholder="Arrival station"
                  value={searchForm.arrival_station}
                  onChange={(e) => setSearchForm({ ...searchForm, arrival_station: e.target.value })}
                  list="arrival-stations"
                  required
                />
                <datalist id="arrival-stations">
                  {stations.map((station) => (
                    <option key={station.STATION_ID} value={station.STATION_NAME}>
                      {station.STATION_NAME} ({station.STATION_CODE})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="travel_date" className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  id="travel_date"
                  className="form-input"
                  value={searchForm.travel_date}
                  onChange={(e) => setSearchForm({ ...searchForm, travel_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isSearching ? (
                    <InlineSpinner text="Searching..." />
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                      Search Trains
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results
                {searchResults.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({searchResults.length} train{searchResults.length !== 1 ? 's' : ''} found)
                  </span>
                )}
              </h2>
            </div>

            {searchResults.length === 0 ? (
              <NoSearchResults onNewSearch={() => setHasSearched(false)} />
            ) : (
              <div className="space-y-4">
                {searchResults.map((schedule) => (
                  <Card key={schedule.SCHEDULE_ID} className="hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between p-6">
                      {/* Train Info */}
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <TrainIcon className="h-7 w-7 text-primary-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {schedule.TRAIN_NAME}
                            </h3>
                            <Badge variant="info" size="sm">
                              {schedule.TRAIN_TYPE}
                            </Badge>
                          </div>

                          {/* Route and Time */}
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="font-medium">{schedule.DEPARTURE_STATION}</span>
                              <ArrowRightIcon className="h-4 w-4" />
                              <span className="font-medium">{schedule.ARRIVAL_STATION}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="h-4 w-4" />
                              <span>
                                {formatTime(schedule.DEPARTURE_TIME)} - {formatTime(schedule.ARRIVAL_TIME)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({calculateDuration(schedule.DEPARTURE_TIME, schedule.ARRIVAL_TIME)})
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(schedule.DEPARTURE_TIME)}</span>
                            </div>
                          </div>

                          {/* Status and Availability */}
                          <div className="flex items-center space-x-4 mt-2">
                            <TrainStatusBadge status={schedule.STATUS} size="sm" />
                            <span className="text-sm text-gray-600">
                              {schedule.AVAILABLE_SEATS} seat{schedule.AVAILABLE_SEATS !== 1 ? 's' : ''} available
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Booking */}
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="flex items-center text-2xl font-bold text-gray-900">
                            <BanknotesIcon className="h-6 w-6 mr-1 text-green-600" />
                            ৳{schedule.BASE_FARE?.toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">per person</p>
                        </div>

                        <button
                          onClick={() => handleBooking(schedule)}
                          disabled={schedule.AVAILABLE_SEATS === 0 || schedule.STATUS !== 'SCHEDULED'}
                          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TicketIcon className="h-5 w-5" />
                          <span>
                            {schedule.AVAILABLE_SEATS === 0 
                              ? 'Sold Out' 
                              : schedule.STATUS !== 'SCHEDULED' 
                                ? 'Not Available' 
                                : 'Book Now'
                            }
                          </span>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Routes */}
        {!hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { from: 'Dhaka Central Railway Station', to: 'Chittagong Railway Station', price: '৳850' },
                  { from: 'Dhaka Central Railway Station', to: 'Sylhet Railway Station', price: '৳750' },
                  { from: 'Dhaka Central Railway Station', to: 'Rajshahi Railway Station', price: '৳800' },
                ].map((route, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchForm({
                        ...searchForm,
                        departure_station: route.from,
                        arrival_station: route.to,
                      });
                    }}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{route.from}</p>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 my-1" />
                        <p className="font-medium text-gray-900">{route.to}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{route.price}</p>
                        <p className="text-xs text-gray-500">from</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
