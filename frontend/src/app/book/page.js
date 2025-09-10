"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "react-query";
import Layout from "../../components/Layout/Layout";
import Card, { CardHeader, CardTitle, CardContent } from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import EmptyState from "../../components/UI/EmptyState";
import { schedulesApi, reservationsApi } from "../../services/api";
import {
    TicketIcon,
    CalendarIcon,
    MapPinIcon,
    ArrowRightIcon,
    ClockIcon,
    BanknotesIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function BookPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const scheduleId = searchParams.get("schedule_id");

    const [bookingForm, setBookingForm] = useState({
        passenger_name: user?.full_name || "",
        passenger_age: "",
        passenger_gender: "",
        special_requests: "",
    });

    const [isBooking, setIsBooking] = useState(false);

    // Fetch schedule details
    const {
        data: scheduleData,
        isLoading: scheduleLoading,
        error: scheduleError,
    } = useQuery(
        ["schedule", scheduleId],
        () => schedulesApi.getById(scheduleId),
        {
            enabled: !!scheduleId,
        }
    );

    const schedule = scheduleData?.data?.data;

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("Please login to book tickets");
            router.push("/auth/login");
            return;
        }

        if (!scheduleId) {
            toast.error("No schedule selected");
            router.push("/search");
            return;
        }
    }, [isAuthenticated, scheduleId, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!schedule) {
            toast.error("Schedule not found");
            return;
        }

        if (schedule.AVAILABLE_SEATS <= 0) {
            toast.error("No seats available");
            return;
        }

        setIsBooking(true);

        try {
            const bookingData = {
                schedule_id: parseInt(scheduleId),
                passenger_name: bookingForm.passenger_name,
                passenger_age: parseInt(bookingForm.passenger_age),
                passenger_gender: bookingForm.passenger_gender,
            };

            const response = await reservationsApi.create(bookingData);

            if (response.data.success) {
                toast.success("Booking created successfully!");
                router.push("/bookings");
            } else {
                toast.error(response.data.error || "Failed to create booking");
            }
        } catch (error) {
            toast.error("Failed to create booking. Please try again.");
            console.error("Booking error:", error);
        } finally {
            setIsBooking(false);
        }
    };

    const formatTime = (timeString) => {
        try {
            return format(parseISO(timeString), "HH:mm");
        } catch (error) {
            return timeString;
        }
    };

    const formatDate = (timeString) => {
        try {
            return format(parseISO(timeString), "MMM dd, yyyy");
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
            return "N/A";
        }
    };

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    }

    if (scheduleLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    }

    if (scheduleError || !schedule) {
        return (
            <Layout>
                <EmptyState
                    message="Schedule not found"
                    description="The selected schedule could not be found."
                    actionText="Back to Search"
                    onAction={() => router.push("/search")}
                />
            </Layout>
        );
    }

    const totalFare = schedule.BASE_FARE;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Book Your Ticket</h1>
                    <p className="text-gray-600 mt-2">
                        Complete your booking for {schedule.TRAIN_NAME}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Schedule Details */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TicketIcon className="h-5 w-5 mr-2 text-primary-600" />
                                    Journey Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary-600">T</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {schedule.TRAIN_NAME}
                                        </h3>
                                        <Badge variant="info" size="sm">
                                            {schedule.TRAIN_TYPE}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{schedule.DEPARTURE_STATION}</span>
                                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{schedule.ARRIVAL_STATION}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <ClockIcon className="h-4 w-4" />
                                        <span>
                                            {formatTime(schedule.DEPARTURE_TIME)} - {formatTime(schedule.ARRIVAL_TIME)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({calculateDuration(schedule.DEPARTURE_TIME, schedule.ARRIVAL_TIME)})
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{formatDate(schedule.DEPARTURE_TIME)}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <BanknotesIcon className="h-4 w-4" />
                                        <span>৳{schedule.BASE_FARE?.toLocaleString()} per person</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Available Seats:</span>
                                        <Badge variant="success" size="sm">
                                            {schedule.AVAILABLE_SEATS}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                                    Passenger Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBooking} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="passenger_name" className="form-label">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="passenger_name"
                                                name="passenger_name"
                                                className="form-input"
                                                value={bookingForm.passenger_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="passenger_age" className="form-label">
                                                Age *
                                            </label>
                                            <input
                                                type="number"
                                                id="passenger_age"
                                                name="passenger_age"
                                                className="form-input"
                                                value={bookingForm.passenger_age}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="120"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="passenger_gender" className="form-label">
                                                Gender *
                                            </label>
                                            <select
                                                id="passenger_gender"
                                                name="passenger_gender"
                                                className="form-input"
                                                value={bookingForm.passenger_gender}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select gender</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>

                                    </div>

                                    <div>
                                        <label htmlFor="special_requests" className="form-label">
                                            Special Requests
                                        </label>
                                        <textarea
                                            id="special_requests"
                                            name="special_requests"
                                            rows={3}
                                            className="form-input"
                                            placeholder="Any special requirements or requests..."
                                            value={bookingForm.special_requests}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Booking Summary */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base Fare</span>
                                                <span>৳{schedule.BASE_FARE?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                                                <span>Total Amount</span>
                                                <span className="text-primary-600">৳{totalFare.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => router.push("/search")}
                                            className="btn-secondary flex-1"
                                        >
                                            Back to Search
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isBooking || schedule.AVAILABLE_SEATS === 0}
                                            className="btn-primary flex-1 flex items-center justify-center"
                                        >
                                            {isBooking ? (
                                                <>
                                                    <LoadingSpinner size="sm" />
                                                    <span className="ml-2">Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <TicketIcon className="h-5 w-5 mr-2" />
                                                    Confirm Booking
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
