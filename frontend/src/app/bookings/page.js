"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "react-query";
import Layout from "../../components/Layout/Layout";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/UI/Card";
import Badge, { BookingStatusBadge } from "../../components/UI/Badge";
import {
  FullPageSpinner,
  InlineSpinner,
} from "../../components/UI/LoadingSpinner";
import { NoBookings, ErrorState } from "../../components/UI/EmptyState";
import { reservationsApi } from "../../services/api";
import {
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== "passenger")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Fetch bookings
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    error,
    refetch,
  } = useQuery(
    ["bookings", selectedStatus, currentPage],
    () =>
      reservationsApi.getAll({
        status: selectedStatus || undefined,
        page: currentPage,
        limit: 10,
      }),
    {
      enabled: Boolean(isAuthenticated && user?.userType === "passenger"),
      select: (data) => data.data,
    }
  );

  if (isLoading) {
    return <FullPageSpinner message="Loading bookings..." />;
  }

  if (!isAuthenticated || user?.userType !== "passenger") {
    return null;
  }

  const bookings = bookingsData?.data || [];
  const filteredBookings = bookings.filter(
    (booking) =>
      !searchTerm ||
      booking.BOOKING_REFERENCE?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      booking.TRAIN_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.DEPARTURE_STATION?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      booking.ARRIVAL_STATION?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: "", label: "All Bookings" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "WAITLISTED", label: "Waitlisted" },
    { value: "COMPLETED", label: "Completed" },
  ];

  if (error) {
    return (
      <Layout>
        <ErrorState
          title="Failed to load bookings"
          description="There was an error loading your bookings. Please try again."
          onRetry={refetch}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-600">
              Manage your train reservations
            </p>
          </div>
          <button
            onClick={() => router.push("/search")}
            className="btn-primary flex items-center"
          >
            <TicketIcon className="h-5 w-5 mr-2" />
            Book New Ticket
          </button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by booking reference, train, or route..."
                    className="pl-10 form-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    className="pl-10 form-input"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {bookingsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <NoBookings onBook={() => router.push("/search")} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card
                key={booking.RESERVATION_ID}
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() =>
                  router.push(`/bookings/${booking.RESERVATION_ID}`)
                }
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Booking Info */}
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-primary-600">T</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.TRAIN_NAME}
                          </h3>
                          <BookingStatusBadge status={booking.BOOKING_STATUS} />
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{booking.DEPARTURE_STATION}</span>
                            <ArrowRightIcon className="h-4 w-4" />
                            <span>{booking.ARRIVAL_STATION}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {format(
                                parseISO(booking.DEPARTURE_TIME),
                                "MMM dd, yyyy • HH:mm"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Booking: {booking.BOOKING_REFERENCE}</span>
                          <span>Seat: {booking.SEAT_NUMBER}</span>
                          <span>Passenger: {booking.PASSENGER_NAME}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        ৳{booking.FARE_AMOUNT?.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {format(parseISO(booking.BOOKING_DATE), "MMM dd, yyyy")}
                      </p>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Show more button if there are more bookings */}
        {bookingsData?.pagination &&
          bookingsData.pagination.total > filteredBookings.length && (
            <div className="text-center">
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="btn-secondary"
              >
                Load More Bookings
              </button>
            </div>
          )}
      </div>
    </Layout>
  );
}
