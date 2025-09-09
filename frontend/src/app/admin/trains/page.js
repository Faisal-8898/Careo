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
import { trainsApi, routesApi } from "../../../services/api";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function AdminTrainsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    train_name: "",
    train_type: "",
    route_id: "",
    total_capacity: "",
    status: "ACTIVE",
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

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "danger";
      case "MAINTENANCE":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Helper function to check if train can be deleted
  const canDeleteTrain = (train) => {
    // For now, we'll assume trains with ACTIVE status might have schedules
    // In a real app, you'd check the actual schedule count
    return train.STATUS === "INACTIVE" || train.STATUS === "MAINTENANCE";
  };

  // Fetch trains
  const {
    data: trainsData,
    isLoading: trainsLoading,
    error,
    refetch,
  } = useQuery(
    ["trains", currentPage, statusFilter],
    () =>
      trainsApi.getAll({
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined,
      }),
    {
      enabled: Boolean(isAuthenticated && user?.userType === "admin"),
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch routes for dropdown
  const { data: routesData } = useQuery(
    ["routes"],
    () => routesApi.getAll({ limit: 100 }),
    {
      enabled: Boolean(isAuthenticated && user?.userType === "admin"),
      select: (data) => data?.data?.data || [],
    }
  );

  // Create train mutation
  const createMutation = useMutation(trainsApi.create, {
    onSuccess: () => {
      toast.success("Train created successfully");
      queryClient.invalidateQueries(["trains"]);
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to create train");
    },
  });

  // Update train mutation
  const updateMutation = useMutation(
    ({ id, data }) => trainsApi.update(id, data),
    {
      onSuccess: () => {
        toast.success("Train updated successfully");
        queryClient.invalidateQueries(["trains"]);
        setShowEditModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to update train");
      },
    }
  );

  // Delete train mutation
  const deleteMutation = useMutation(trainsApi.delete, {
    onSuccess: () => {
      toast.success("Train deleted successfully");
      queryClient.invalidateQueries(["trains"]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete train");
    },
  });

  const resetForm = () => {
    setFormData({
      train_name: "",
      train_type: "",
      route_id: "",
      total_capacity: "",
      status: "ACTIVE",
    });
    setSelectedTrain(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTrain = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateTrain = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedTrain.TRAIN_ID,
      data: formData,
    });
  };

  const handleEditTrain = (train) => {
    setSelectedTrain(train);
    setFormData({
      train_name: train.TRAIN_NAME,
      train_type: train.TRAIN_TYPE,
      route_id: train.ROUTE_ID,
      total_capacity: train.TOTAL_CAPACITY,
      status: train.STATUS,
    });
    setShowEditModal(true);
  };

  const handleDeleteTrain = async (trainId) => {
    if (window.confirm("Are you sure you want to delete this train? This action cannot be undone.")) {
      deleteMutation.mutate(trainId);
    }
  };

  if (isLoading) {
    return <FullPageSpinner message="Loading admin panel..." />;
  }

  if (!isAuthenticated || user?.userType !== "admin") {
    return null;
  }

  const trains = Array.isArray(trainsData?.data?.data) ? trainsData.data.data : [];
  const routes = Array.isArray(routesData) ? routesData : [];

  if (error) {
    return (
      <Layout>
        <ErrorState
          title="Failed to load trains"
          description="There was an error loading the trains. Please try again."
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
              Train Management
            </h1>
            <p className="text-sm text-gray-600">
              Manage trains and their configurations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                queryClient.removeQueries(["trains"]);
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
              Add New Train
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trains..."
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Trains Table */}
        {trainsLoading ? (
          <Card>
            <div className="p-6">
              <InlineSpinner text="Loading trains..." />
            </div>
          </Card>
        ) : trains.length === 0 ? (
          <Card>
            <div className="p-6 text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-400">T</span>
              </div>
              <p className="mt-2 text-gray-600">No trains found</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Train</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Route</th>
                    <th className="table-header-cell">Capacity</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trains
                    .filter((train) =>
                      searchTerm === "" ||
                      train.TRAIN_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      train.TRAIN_TYPE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      train.ROUTE_NAME.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((train) => (
                      <tr key={train.TRAIN_ID} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-lg font-bold text-blue-600">T</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {train.TRAIN_NAME}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {train.TRAIN_ID}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <Badge variant="info" size="sm">
                            {train.TRAIN_TYPE}
                          </Badge>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {train.ROUTE_NAME}
                            </div>
                            <div className="text-sm text-gray-500">
                              {train.ROUTE_CODE}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <Badge variant="secondary" size="sm">
                            {train.TOTAL_CAPACITY} seats
                          </Badge>
                        </td>
                        <td className="table-cell">
                          <Badge variant={getStatusColor(train.STATUS)} size="sm">
                            {train.STATUS}
                          </Badge>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm text-gray-500">
                            {formatDate(train.CREATED_AT)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditTrain(train)}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                              title="Edit train"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrain(train.TRAIN_ID)}
                              disabled={deleteMutation.isLoading || !canDeleteTrain(train)}
                              className={`p-2 transition-colors duration-200 disabled:opacity-50 ${canDeleteTrain(train)
                                ? "text-gray-400 hover:text-red-600"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                              title={
                                canDeleteTrain(train)
                                  ? "Delete train"
                                  : "Cannot delete train with active schedules"
                              }
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
        {!searchTerm && trainsData?.data?.pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {trains.length} of {trainsData.data.pagination.total} trains
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
                disabled={trains.length < 20}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create Train Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Train</h3>
              <form onSubmit={handleCreateTrain} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Train Name</label>
                    <input
                      type="text"
                      name="train_name"
                      value={formData.train_name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Chittagong Express"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Train Type</label>
                    <select
                      name="train_type"
                      value={formData.train_type}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select train type</option>
                      <option value="Express">Express</option>
                      <option value="Intercity">Intercity</option>
                      <option value="Local">Local</option>
                      <option value="Mail">Mail</option>
                      <option value="Freight">Freight</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Route</label>
                    <select
                      name="route_id"
                      value={formData.route_id}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select a route</option>
                      {routes.map((route) => (
                        <option key={route.ROUTE_ID} value={route.ROUTE_ID}>
                          {route.ROUTE_NAME} ({route.ROUTE_CODE})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Total Capacity</label>
                    <input
                      type="number"
                      name="total_capacity"
                      value={formData.total_capacity}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      max="1000"
                      placeholder="e.g., 200"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
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
                    {createMutation.isLoading ? "Creating..." : "Create Train"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Train Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit Train</h3>
              <form onSubmit={handleUpdateTrain} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Train Name</label>
                    <input
                      type="text"
                      name="train_name"
                      value={formData.train_name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Chittagong Express"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Train Type</label>
                    <select
                      name="train_type"
                      value={formData.train_type}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select train type</option>
                      <option value="Express">Express</option>
                      <option value="Intercity">Intercity</option>
                      <option value="Local">Local</option>
                      <option value="Mail">Mail</option>
                      <option value="Freight">Freight</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Route</label>
                    <select
                      name="route_id"
                      value={formData.route_id}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select a route</option>
                      {routes.map((route) => (
                        <option key={route.ROUTE_ID} value={route.ROUTE_ID}>
                          {route.ROUTE_NAME} ({route.ROUTE_CODE})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Total Capacity</label>
                    <input
                      type="number"
                      name="total_capacity"
                      value={formData.total_capacity}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      max="1000"
                      placeholder="e.g., 200"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
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
                    {updateMutation.isLoading ? "Updating..." : "Update Train"}
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