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
import { routesApi, stationsApi } from "../../../services/api";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    MapIcon,
    EyeIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function AdminRoutesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStationsModal, setShowStationsModal] = useState(false);
    const [showAddStationModal, setShowAddStationModal] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        route_name: "",
        route_code: "",
    });

    const [stationFormData, setStationFormData] = useState({
        station_id: "",
        stop_sequence: "",
        distance_km: "",
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

    // Fetch routes
    const {
        data: routesData,
        isLoading: routesLoading,
        error,
        refetch,
    } = useQuery(
        ["routes", currentPage],
        () =>
            routesApi.getAll({
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

    // Fetch stations for dropdown
    const { data: stationsData } = useQuery(
        ["stations"],
        () => stationsApi.getAll({ limit: 100 }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === "admin"),
            select: (data) => data?.data?.data || [],
        }
    );

    // Fetch route stations when viewing stations
    const { data: routeStationsData, refetch: refetchRouteStations } = useQuery(
        ["route-stations", selectedRoute?.ROUTE_ID],
        () => routesApi.getStations(selectedRoute?.ROUTE_ID),
        {
            enabled: Boolean(selectedRoute?.ROUTE_ID && showStationsModal),
            select: (data) => data?.data?.data || [],
        }
    );

    // Create route mutation
    const createMutation = useMutation(routesApi.create, {
        onSuccess: () => {
            toast.success("Route created successfully");
            queryClient.invalidateQueries(["routes"]);
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to create route");
        },
    });

    // Update route mutation
    const updateMutation = useMutation(
        ({ id, data }) => routesApi.update(id, data),
        {
            onSuccess: () => {
                toast.success("Route updated successfully");
                queryClient.invalidateQueries(["routes"]);
                setShowEditModal(false);
                resetForm();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to update route");
            },
        }
    );

    // Delete route mutation
    const deleteMutation = useMutation(routesApi.delete, {
        onSuccess: () => {
            toast.success("Route deleted successfully");
            queryClient.invalidateQueries(["routes"]);
            refetch();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to delete route");
        },
    });

    // Add station to route mutation
    const addStationMutation = useMutation(
        ({ routeId, data }) => routesApi.addStation(routeId, data),
        {
            onSuccess: () => {
                toast.success("Station added to route successfully");
                refetchRouteStations();
                setShowAddStationModal(false);
                resetStationForm();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to add station to route");
            },
        }
    );

    // Remove station from route mutation
    const removeStationMutation = useMutation(
        ({ routeId, stationId }) => routesApi.removeStation(routeId, stationId),
        {
            onSuccess: () => {
                toast.success("Station removed from route successfully");
                refetchRouteStations();
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || "Failed to remove station from route");
            },
        }
    );

    const resetForm = () => {
        setFormData({
            route_name: "",
            route_code: "",
        });
        setSelectedRoute(null);
    };

    const resetStationForm = () => {
        setStationFormData({
            station_id: "",
            stop_sequence: "",
            distance_km: "",
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStationInputChange = (e) => {
        const { name, value } = e.target;
        setStationFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateRoute = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdateRoute = (e) => {
        e.preventDefault();
        updateMutation.mutate({
            id: selectedRoute.ROUTE_ID,
            data: formData,
        });
    };

    const handleEditRoute = (route) => {
        setSelectedRoute(route);
        setFormData({
            route_name: route.ROUTE_NAME,
            route_code: route.ROUTE_CODE,
        });
        setShowEditModal(true);
    };

    const handleDeleteRoute = async (routeId) => {
        if (window.confirm("Are you sure you want to delete this route?")) {
            deleteMutation.mutate(routeId);
        }
    };

    const handleViewStations = (route) => {
        setSelectedRoute(route);
        setShowStationsModal(true);
    };

    const handleAddStation = (e) => {
        e.preventDefault();
        addStationMutation.mutate({
            routeId: selectedRoute.ROUTE_ID,
            data: stationFormData,
        });
    };

    const handleRemoveStation = async (stationId) => {
        if (window.confirm("Are you sure you want to remove this station from the route?")) {
            removeStationMutation.mutate({
                routeId: selectedRoute.ROUTE_ID,
                stationId: stationId,
            });
        }
    };

    if (isLoading) {
        return <FullPageSpinner message="Loading admin panel..." />;
    }

    if (!isAuthenticated || user?.userType !== "admin") {
        return null;
    }

    const routes = Array.isArray(routesData?.data?.data) ? routesData.data.data : [];
    const stations = Array.isArray(stationsData) ? stationsData : [];
    const routeStations = Array.isArray(routeStationsData) ? routeStationsData : [];

    if (error) {
        return (
            <Layout>
                <ErrorState
                    title="Failed to load routes"
                    description="There was an error loading the routes. Please try again."
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
                            Route Management
                        </h1>
                        <p className="text-sm text-gray-600">
                            Manage train routes and their stations
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                queryClient.removeQueries(["routes"]);
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
                            Add New Route
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
                                placeholder="Search routes by name or code..."
                                className="pl-10 form-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Routes Table */}
                {routesLoading ? (
                    <Card>
                        <div className="p-6">
                            <InlineSpinner text="Loading routes..." />
                        </div>
                    </Card>
                ) : routes.length === 0 ? (
                    <Card>
                        <div className="p-6 text-center">
                            <MapIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2 text-gray-600">No routes found</p>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th className="table-header-cell">Route</th>
                                        <th className="table-header-cell">Code</th>
                                        <th className="table-header-cell">Stations</th>
                                        <th className="table-header-cell">Created</th>
                                        <th className="table-header-cell">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {routes
                                        .filter((route) =>
                                            searchTerm === "" ||
                                            route.ROUTE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            route.ROUTE_CODE.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((route) => (
                                            <tr key={route.ROUTE_ID} className="table-row">
                                                <td className="table-cell">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                                            <MapIcon className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {route.ROUTE_NAME}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: {route.ROUTE_ID}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <Badge variant="success" size="sm">
                                                        {route.ROUTE_CODE}
                                                    </Badge>
                                                </td>
                                                <td className="table-cell">
                                                    <Badge variant="info" size="sm">
                                                        {route.STATION_COUNT} stations
                                                    </Badge>
                                                </td>
                                                <td className="table-cell">
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(route.CREATED_AT)}
                                                    </span>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewStations(route)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                            title="View stations"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditRoute(route)}
                                                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                                                            title="Edit route"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRoute(route.ROUTE_ID)}
                                                            disabled={deleteMutation.isLoading}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                                            title="Delete route"
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
                {!searchTerm && routesData?.data?.pagination && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {routes.length} of {routesData.data.pagination.total} routes
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
                                disabled={routes.length < 20}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Route Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Create New Route</h3>
                            <form onSubmit={handleCreateRoute} className="space-y-4">
                                <div>
                                    <label className="form-label">Route Name</label>
                                    <input
                                        type="text"
                                        name="route_name"
                                        value={formData.route_name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Route Code</label>
                                    <input
                                        type="text"
                                        name="route_code"
                                        value={formData.route_code}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., DHAKA-CTG"
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
                                        {createMutation.isLoading ? "Creating..." : "Create Route"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Route Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Edit Route</h3>
                            <form onSubmit={handleUpdateRoute} className="space-y-4">
                                <div>
                                    <label className="form-label">Route Name</label>
                                    <input
                                        type="text"
                                        name="route_name"
                                        value={formData.route_name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Route Code</label>
                                    <input
                                        type="text"
                                        name="route_code"
                                        value={formData.route_code}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., DHAKA-CTG"
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
                                        {updateMutation.isLoading ? "Updating..." : "Update Route"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Stations Modal */}
                {showStationsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    Stations in {selectedRoute?.ROUTE_NAME}
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            resetStationForm();
                                            setShowAddStationModal(true);
                                        }}
                                        className="btn-primary flex items-center"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Station
                                    </button>
                                    <button
                                        onClick={() => setShowStationsModal(false)}
                                        className="btn-secondary"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {routeStations.length === 0 ? (
                                <div className="text-center py-8">
                                    <MapIcon className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-2 text-gray-600">No stations in this route</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead className="table-header">
                                            <tr>
                                                <th className="table-header-cell">Sequence</th>
                                                <th className="table-header-cell">Station</th>
                                                <th className="table-header-cell">Code</th>
                                                <th className="table-header-cell">City</th>
                                                <th className="table-header-cell">Distance (km)</th>
                                                <th className="table-header-cell">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {routeStations.map((station) => (
                                                <tr key={`${station.STATION_ID}-${station.STOP_SEQUENCE}`} className="table-row">
                                                    <td className="table-cell">
                                                        <Badge variant="info" size="sm">
                                                            {station.STOP_SEQUENCE}
                                                        </Badge>
                                                    </td>
                                                    <td className="table-cell">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {station.STATION_NAME}
                                                        </div>
                                                    </td>
                                                    <td className="table-cell">
                                                        <Badge variant="secondary" size="sm">
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
                                                            {station.DISTANCE_KM || 0} km
                                                        </span>
                                                    </td>
                                                    <td className="table-cell">
                                                        <button
                                                            onClick={() => handleRemoveStation(station.STATION_ID)}
                                                            disabled={removeStationMutation.isLoading}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                                                            title="Remove station"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Station Modal */}
                {showAddStationModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Add Station to Route</h3>
                            <form onSubmit={handleAddStation} className="space-y-4">
                                <div>
                                    <label className="form-label">Station</label>
                                    <select
                                        name="station_id"
                                        value={stationFormData.station_id}
                                        onChange={handleStationInputChange}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select a station</option>
                                        {stations.map((station) => (
                                            <option key={station.STATION_ID} value={station.STATION_ID}>
                                                {station.STATION_NAME} ({station.STATION_CODE})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Stop Sequence</label>
                                    <input
                                        type="number"
                                        name="stop_sequence"
                                        value={stationFormData.stop_sequence}
                                        onChange={handleStationInputChange}
                                        className="form-input"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Distance (km)</label>
                                    <input
                                        type="number"
                                        name="distance_km"
                                        value={stationFormData.distance_km}
                                        onChange={handleStationInputChange}
                                        className="form-input"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddStationModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addStationMutation.isLoading}
                                        className="btn-primary flex-1"
                                    >
                                        {addStationMutation.isLoading ? "Adding..." : "Add Station"}
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
