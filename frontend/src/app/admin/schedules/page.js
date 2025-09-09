"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Layout from "../../../components/Layout/Layout";
import Card, {
    CardHeader,
    CardTitle,
    CardContent,
} from "../../../components/UI/Card";
import Badge from "../../../components/UI/Badge";
import {
    FullPageSpinner,
    InlineSpinner,
} from "../../../components/UI/LoadingSpinner";
import { ErrorState } from "../../../components/UI/EmptyState";
import { schedulesApi, trainsApi, stationsApi } from "../../../services/api";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function AdminSchedulesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        train_id: "",
        departure_station_id: "",
        arrival_station_id: "",
        departure_time: "",
        arrival_time: "",
        base_fare: "",
        available_seats: "",
    });

    const [statusFormData, setStatusFormData] = useState({
        status: "",
    });

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.userType !== "admin")) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, user, isLoading, router]);

    // Helper function to safely format dates
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "MMM dd, yyyy");
        } catch (error) {
            return "Invalid Date";
        }
    };

    // Helper function to format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "MMM dd, yyyy HH:mm");
        } catch (error) {
            return "Invalid Date";
        }
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case "SCHEDULED":
                return "info";
            case "DEPARTED":
                return "warning";
            case "ARRIVED":
                return "success";
            case "CANCELLED":
                return "danger";
            case "DELAYED":
                return "warning";
            default:
                return "secondary";
        }
    };

    // Fetch schedules
    const {
        data: schedulesData,
        isLoading: schedulesLoading,
        error,
        refetch,
    } = useQuery(
        ["schedules", currentPage, statusFilter, dateFrom, dateTo],
        () =>
            schedulesApi.getAll({
                page: currentPage,
                limit: 20,
                status: statusFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin"),
            staleTime: 0,
            cacheTime: 0,
            refetchOnWindowFocus: false,
        }
    );

    // Fetch trains for dropdown
    const { data: trainsData } = useQuery(
        ["trains"],
        () => trainsApi.getAll({ limit: 100 }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin"),
            select: (data) => data?.data?.data || [],
        }
    );

    // Fetch stations for dropdown
    const { data: stationsData } = useQuery(
        ["stations"],
        () => stationsApi.getAll({ limit: 100 }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin"),
            select: (data) => data?.data?.data || [],
        }
    );

    // Create schedule mutation
    const createMutation = useMutation(schedulesApi.create, {
        onSuccess: () => {
            toast.success("Schedule created successfully");
            queryClient.invalidateQueries(["schedules"]);
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to create schedule");
        },
    });

    // Update schedule mutation
    const updateMutation = useMutation(
        ({ id, data }) => schedulesApi.update(id, data),
        {
            onSuccess: () => {
                toast.success("Schedule updated successfully");
                queryClient.invalidateQueries(["schedules"]);
                setShowEditModal(false);
                resetForm();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to update schedule");
            },
        }
    );

    // Delete schedule mutation
    const deleteMutation = useMutation(schedulesApi.delete, {
        onSuccess: () => {
            toast.success("Schedule deleted successfully");
            queryClient.invalidateQueries(["schedules"]);
            refetch();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to delete schedule");
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation(
        ({ id, data }) => schedulesApi.updateStatus(id, data),
        {
            onSuccess: () => {
                toast.success("Schedule status updated successfully");
                queryClient.invalidateQueries(["schedules"]);
                setShowStatusModal(false);
                resetStatusForm();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to update schedule status");
            },
        }
    );

    const resetForm = () => {
        setFormData({
            train_id: "",
            departure_station_id: "",
            arrival_station_id: "",
            departure_time: "",
            arrival_time: "",
            base_fare: "",
            available_seats: "",
        });
        setSelectedSchedule(null);
    };

    const resetStatusForm = () => {
        setStatusFormData({
            status: "",
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStatusInputChange = (e) => {
        const { name, value } = e.target;
        setStatusFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateSchedule = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdateSchedule = (e) => {
        e.preventDefault();
        updateMutation.mutate({
            id: selectedSchedule.SCHEDULE_ID,
            data: formData,
        });
    };

    const handleEditSchedule = (schedule) => {
        setSelectedSchedule(schedule);
        setFormData({
            train_id: schedule.TRAIN_ID,
            departure_station_id: schedule.DEPARTURE_STATION_ID,
            arrival_station_id: schedule.ARRIVAL_STATION_ID,
            departure_time: format(parseISO(schedule.DEPARTURE_TIME), "yyyy-MM-dd'T'HH:mm"),
            arrival_time: format(parseISO(schedule.ARRIVAL_TIME), "yyyy-MM-dd'T'HH:mm"),
            base_fare: schedule.BASE_FARE,
            available_seats: schedule.AVAILABLE_SEATS,
        });
        setShowEditModal(true);
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            deleteMutation.mutate(scheduleId);
        }
    };

    const handleUpdateStatus = (schedule) => {
        setSelectedSchedule(schedule);
        setStatusFormData({
            status: schedule.STATUS,
        });
        setShowStatusModal(true);
    };

    const handleStatusUpdate = (e) => {
        e.preventDefault();
        updateStatusMutation.mutate({
            id: selectedSchedule.SCHEDULE_ID,
            data: statusFormData,
        });
    };

    if (isLoading) {
        return <FullPageSpinner message="Loading admin panel..." />;
    }

    if (!isAuthenticated || user?.userType !== "admin") {
        return null;
    }

    const schedules = Array.isArray(schedulesData?.data?.data) ? schedulesData.data.data : [];
    const trains = Array.isArray(trainsData) ? trainsData : [];
    const stations = Array.isArray(stationsData) ? stationsData : [];

    if (error) {
        return (
            <Layout>
                <ErrorState
                    title="Failed to load schedules"
                    description="There was an error loading the schedules. Please try again."
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
                        <h1 className="text-2xl font-bold text-gray-900">
                            Schedule Management
                        </h1>
                        <p className="text-sm text-gray-600">
                            Manage train schedules and timings
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                queryClient.removeQueries(["schedules"]);
                                refetch();
                            }}
                            className="btn-secondary flex items-center"
                            title="Refresh data"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowCreateModal(true);
                            }}
                            className="btn-primary flex items-center"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add New Schedule
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search schedules..."
                                    className="pl-10 form-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="">All Status</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="DEPARTED">Departed</option>
                                <option value="ARRIVED">Arrived</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="DELAYED">Delayed</option>
                            </select>
                            <input
                                type="date"
                                placeholder="From Date"
                                className="form-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <input
                                type="date"
                                placeholder="To Date"
                                className="form-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Schedules Table */}
                {schedulesLoading ? (
                    <Card>
                        <div className="p-6">
                            <InlineSpinner text="Loading schedules..." />
                        </div>
                    </Card>
                ) : schedules.length === 0 ? (
                    <Card>
                        <div className="p-6 text-center">
                            <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2 text-gray-600">No schedules found</p>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Train</th>
                                        <th className="table-header-cell">Route</th>
                                        <th className="table-header-cell">Departure</th>
                                        <th className="table-header-cell">Arrival</th>
                                        <th className="table-header-cell">Fare</th>
                                        <th className="table-header-cell">Seats</th>
                                        <th className="table-header-cell">Status</th>
                                        <th className="table-header-cell">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schedules
                                        .filter((schedule) =>
                                            searchTerm === "" ||
                                            schedule.TRAIN_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            schedule.ROUTE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            schedule.DEPARTURE_STATION.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            schedule.ARRIVAL_STATION.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((schedule) => (
                                            <tr key={schedule.SCHEDULE_ID} className="table-row">
                                                <td className="table-cell">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                            <ClockIcon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {schedule.TRAIN_NAME}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {schedule.TRAIN_TYPE}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {schedule.DEPARTURE_STATION} → {schedule.ARRIVAL_STATION}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {schedule.DEPARTURE_CODE} → {schedule.ARRIVAL_CODE}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatDateTime(schedule.DEPARTURE_TIME)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatDateTime(schedule.ARRIVAL_TIME)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        ৳{schedule.BASE_FARE}
                                                    </span>
                                                </td>
                                                <td className="table-cell">
                                                    <Badge variant="info" size="sm">
                                                        {schedule.AVAILABLE_SEATS} seats
                                                    </Badge>
                                                </td>
                                                <td className="table-cell">
                                                    <Badge variant={getStatusColor(schedule.STATUS)} size="sm">
                                                        {schedule.STATUS}
                                                    </Badge>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(schedule)}
                                                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                                                            title="Update status"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditSchedule(schedule)}
                                                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                                                            title="Edit schedule"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSchedule(schedule.SCHEDULE_ID)}
                                                            disabled={deleteMutation.isLoading}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                                            title="Delete schedule"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Pagination */}
                {!searchTerm && schedulesData?.data?.pagination && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {schedules.length} of {schedulesData.data.pagination.total} schedules
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-700">
                                Page {currentPage}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                disabled={schedules.length < 20}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Schedule Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-4">Create New Schedule</h3>
                            <form onSubmit={handleCreateSchedule} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Train</label>
                                        <select
                                            name="train_id"
                                            value={formData.train_id}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Select a train</option>
                                            {trains.map((train) => (
                                                <option key={train.TRAIN_ID} value={train.TRAIN_ID}>
                                                    {train.TRAIN_NAME} ({train.TRAIN_TYPE})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Base Fare (৳)</label>
                                        <input
                                            type="number"
                                            name="base_fare"
                                            value={formData.base_fare}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Departure Station</label>
                                        <select
                                            name="departure_station_id"
                                            value={formData.departure_station_id}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Select departure station</option>
                                            {stations.map((station) => (
                                                <option key={station.STATION_ID} value={station.STATION_ID}>
                                                    {station.STATION_NAME} ({station.STATION_CODE})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Arrival Station</label>
                                        <select
                                            name="arrival_station_id"
                                            value={formData.arrival_station_id}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Select arrival station</option>
                                            {stations.map((station) => (
                                                <option key={station.STATION_ID} value={station.STATION_ID}>
                                                    {station.STATION_NAME} ({station.STATION_CODE})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Departure Time</label>
                                        <input
                                            type="datetime-local"
                                            name="departure_time"
                                            value={formData.departure_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Arrival Time</label>
                                        <input
                                            type="datetime-local"
                                            name="arrival_time"
                                            value={formData.arrival_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Available Seats</label>
                                        <input
                                            type="number"
                                            name="available_seats"
                                            value={formData.available_seats}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isLoading}
                                        className="btn-primary flex-1"
                                    >
                                        {createMutation.isLoading ? "Creating..." : "Create Schedule"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Schedule Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-4">Edit Schedule</h3>
                            <form onSubmit={handleUpdateSchedule} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Base Fare (৳)</label>
                                        <input
                                            type="number"
                                            name="base_fare"
                                            value={formData.base_fare}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Available Seats</label>
                                        <input
                                            type="number"
                                            name="available_seats"
                                            value={formData.available_seats}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Departure Time</label>
                                        <input
                                            type="datetime-local"
                                            name="departure_time"
                                            value={formData.departure_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Arrival Time</label>
                                        <input
                                            type="datetime-local"
                                            name="arrival_time"
                                            value={formData.arrival_time}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isLoading}
                                        className="btn-primary flex-1"
                                    >
                                        {updateMutation.isLoading ? "Updating..." : "Update Schedule"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Update Status Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Update Schedule Status</h3>
                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                <div>
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        value={statusFormData.status}
                                        onChange={handleStatusInputChange}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select status</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="DEPARTED">Departed</option>
                                        <option value="ARRIVED">Arrived</option>
                                        <option value="CANCELLED">Cancelled</option>
                                        <option value="DELAYED">Delayed</option>
                                    </select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatusModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateStatusMutation.isLoading}
                                        className="btn-primary flex-1"
                                    >
                                        {updateStatusMutation.isLoading ? "Updating..." : "Update Status"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
