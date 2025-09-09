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
import Badge, { TrainStatusBadge } from "../../../components/UI/Badge";
import {
  FullPageSpinner,
  InlineSpinner,
} from "../../../components/UI/LoadingSpinner";
import { NoTrains, ErrorState } from "../../../components/UI/EmptyState";
import { trainsApi, routesApi } from "../../../services/api";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function AdminTrainsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== "admin")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Fetch trains based on backend controller structure
  const {
    data: trainsData,
    isLoading: trainsLoading,
    error,
    refetch,
  } = useQuery(
    ["trains", selectedStatus, currentPage],
    () =>
      trainsApi.getAll({
        status: selectedStatus || undefined,
        page: currentPage,
        limit: 20,
      }),
    {
      enabled: isAuthenticated && user?.userType === "admin",
      select: (data) => data.data,
    }
  );

  // Fetch routes for create/edit forms
  const { data: routesData } = useQuery(
    "routes",
    () => routesApi.getAll({ limit: 100 }),
    {
      enabled: isAuthenticated && user?.userType === "admin",
      select: (data) => data.data.data || [],
    }
  );

  // Delete train mutation
  const deleteMutation = useMutation(trainsApi.delete, {
    onSuccess: () => {
      toast.success("Train deleted successfully");
      queryClient.invalidateQueries("trains");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete train");
    },
  });

  if (isLoading) {
    return <FullPageSpinner message="Loading admin panel..." />;
  }

  if (!isAuthenticated || user?.userType !== "admin") {
    return null;
  }

  const trains = trainsData?.data || [];
  const routes = routesData || [];

  const filteredTrains = trains.filter(
    (train) =>
      !searchTerm ||
      train.TRAIN_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.TRAIN_TYPE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.ROUTE_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "MAINTENANCE", label: "Maintenance" },
  ];

  const handleDeleteTrain = async (trainId) => {
    if (window.confirm("Are you sure you want to delete this train?")) {
      deleteMutation.mutate(trainId);
    }
  };

  const handleEditTrain = (train) => {
    setSelectedTrain(train);
    setShowEditModal(true);
  };

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
              Manage trains, routes, and scheduling
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Train
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
                    placeholder="Search by train name, type, or route..."
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

        {/* Trains Table */}
        {trainsLoading ? (
          <Card>
            <div className="p-6">
              <InlineSpinner text="Loading trains..." />
            </div>
          </Card>
        ) : filteredTrains.length === 0 ? (
          <NoTrains onCreate={() => setShowCreateModal(true)} />
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
                  {filteredTrains.map((train) => (
                    <tr key={train.TRAIN_ID} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-lg font-bold text-primary-600">T</span>
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
                        <span className="text-sm text-gray-900">
                          {train.TOTAL_CAPACITY} seats
                        </span>
                      </td>
                      <td className="table-cell">
                        <TrainStatusBadge status={train.STATUS} size="sm" />
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {format(parseISO(train.CREATED_AT), "MMM dd, yyyy")}
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
                            disabled={deleteMutation.isLoading}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                            title="Delete train"
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
        {trainsData?.pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredTrains.length} of {trainsData.pagination.total}{" "}
              trains
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
                disabled={filteredTrains.length < 20}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modals would go here */}
      {/* I'll create these as separate components following the backend API structure */}
    </Layout>
  );
}
