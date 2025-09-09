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
import { stationsApi } from "../../../services/api";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function AdminStationsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Helper function to safely format dates
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "MMM dd, yyyy");
        } catch (error) {
            return "Invalid Date";
        }
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        station_name: "",
        station_code: "",
        city: "",
    });

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.userType !== "admin")) {
            router.push("/auth/login");
        }
    }, [isAuthenticated, user, isLoading, router]);

    // Fetch stations
    const {
        data: stationsData,
        isLoading: stationsLoading,
        error,
        refetch,
    } = useQuery(
        ["stations", currentPage],
        () =>
            stationsApi.getAll({
                page: currentPage,
                limit: 20,
            }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin"),
            staleTime: 0,
            cacheTime: 0,
            refetchOnWindowFocus: false,
        }
    );

    // Search stations
    const { data: searchResults, isLoading: searchLoading } = useQuery(
        ["stations-search", searchTerm],
        () => stationsApi.search(searchTerm),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin" && searchTerm.length >= 2),
        }
    );

    // Create station mutation
    const createMutation = useMutation(stationsApi.create, {
        onSuccess: () => {
            toast.success("Station created successfully");
            queryClient.invalidateQueries(["stations"]);
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to create station");
        },
    });

    // Update station mutation
    const updateMutation = useMutation(
        ({ id, data }) => stationsApi.update(id, data),
        {
            onSuccess: () => {
                toast.success("Station updated successfully");
                queryClient.invalidateQueries(["stations"]);
                setShowEditModal(false);
                resetForm();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to update station");
            },
        }
    );

    // Delete station mutation
    const deleteMutation = useMutation(stationsApi.delete, {
        onSuccess: () => {
            toast.success("Station deleted successfully");
            queryClient.invalidateQueries(["stations"]);
            refetch();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to delete station");
        },
    });

    const resetForm = () => {
        setFormData({
            station_name: "",
            station_code: "",
            city: "",
        });
        setSelectedStation(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateStation = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdateStation = (e) => {
        e.preventDefault();
        updateMutation.mutate({
            id: selectedStation.STATION_ID,
            data: formData,
        });
    };

    const handleEditStation = (station) => {
        setSelectedStation(station);
        setFormData({
            station_name: station.STATION_NAME,
            station_code: station.STATION_CODE,
            city: station.CITY,
        });
        setShowEditModal(true);
    };

    const handleDeleteStation = async (stationId) => {
        if (window.confirm("Are you sure you want to delete this station?")) {
            deleteMutation.mutate(stationId);
        }
    };

    if (isLoading) {
        return <FullPageSpinner message="Loading admin panel..." />;
    }

    if (!isAuthenticated || user?.userType !== "admin") {
        return null;
    }

    const stations = Array.isArray(stationsData?.data?.data) ? stationsData.data.data : [];
    const displayStations = searchTerm.length >= 2
        ? (Array.isArray(searchResults?.data?.data) ? searchResults.data.data : [])
        : stations;

    if (error) {
        return (
            <Layout>
                <ErrorState
                    title="Failed to load stations"
                    description="There was an error loading the stations. Please try again."
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
                            Station Management
                        </h1>
                        <p className="text-sm text-gray-600">
                            Manage train stations and locations
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                queryClient.removeQueries(["stations"]);
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
                            Add New Station
                        </button>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pb-4">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search stations by name, code, or city..."
                                className="pl-10 form-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>


                {/* Stations Table */}
                {stationsLoading ? (
                    <Card>
                        <div className="p-6">
                            <InlineSpinner text="Loading stations..." />
                        </div>
                    </Card>
                ) : displayStations.length === 0 ? (
                    <Card>
                        <div className="p-6 text-center">
                            <MapPinIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2 text-gray-600">
                                {searchTerm.length >= 2 ? "No stations found matching your search" : "No stations found"}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Station</th>
                                        <th className="table-header-cell">Code</th>
                                        <th className="table-header-cell">City</th>
                                        <th className="table-header-cell">Created</th>
                                        <th className="table-header-cell">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Array.isArray(displayStations) && displayStations.map((station) => (
                                        <tr key={station.STATION_ID} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                        <MapPinIcon className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {station.STATION_NAME}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {station.STATION_ID}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <Badge variant="info" size="sm">
                                                    {station.STATION_CODE}
                                                </Badge>
                                            </td>
                                            <td className="table-cell">
                                                <span className="text-sm text-gray-900">
                                                    {station.CITY}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(station.CREATED_AT)}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEditStation(station)}
                                                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                                                        title="Edit station"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStation(station.STATION_ID)}
                                                        disabled={deleteMutation.isLoading}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                                        title="Delete station"
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
                {!searchTerm && stationsData?.data?.pagination && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {stations.length} of {stationsData.data.pagination.total} stations
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
                                disabled={stations.length < 20}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Station Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Create New Station</h3>
                            <form onSubmit={handleCreateStation} className="space-y-4">
                                <div>
                                    <label className="form-label">Station Name</label>
                                    <input
                                        type="text"
                                        name="station_name"
                                        value={formData.station_name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Station Code</label>
                                    <input
                                        type="text"
                                        name="station_code"
                                        value={formData.station_code}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., NYC"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
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
                                        {createMutation.isLoading ? "Creating..." : "Create Station"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Station Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Edit Station</h3>
                            <form onSubmit={handleUpdateStation} className="space-y-4">
                                <div>
                                    <label className="form-label">Station Name</label>
                                    <input
                                        type="text"
                                        name="station_name"
                                        value={formData.station_name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Station Code</label>
                                    <input
                                        type="text"
                                        name="station_code"
                                        value={formData.station_code}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., NYC"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
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
                                        {updateMutation.isLoading ? "Updating..." : "Update Station"}
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
