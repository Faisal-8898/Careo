"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/services/api";
import Layout from "@/components/Layout/Layout";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import EmptyState from "@/components/UI/EmptyState";
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ClockIcon,
    MapIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";

export default function DataLineagePage() {
    const [activeTab, setActiveTab] = useState("revenue");
    const [filters, setFilters] = useState({
        date_from: "",
        date_to: "",
        route_id: "",
        train_id: "",
    });

    // Data states
    const [revenueData, setRevenueData] = useState(null);
    const [utilizationData, setUtilizationData] = useState(null);
    const [routesData, setRoutesData] = useState(null);

    // Loading states
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [utilizationLoading, setUtilizationLoading] = useState(false);
    const [routesLoading, setRoutesLoading] = useState(false);

    // Error states
    const [revenueError, setRevenueError] = useState(null);
    const [utilizationError, setUtilizationError] = useState(null);
    const [routesError, setRoutesError] = useState(null);

    // Fetch data functions
    const fetchRevenueData = async () => {
        setRevenueLoading(true);
        setRevenueError(null);
        try {
            const response = await adminApi.getRevenueSourceLineage(filters);
            setRevenueData(response.data);
        } catch (error) {
            setRevenueError(error.message);
        } finally {
            setRevenueLoading(false);
        }
    };

    const fetchUtilizationData = async () => {
        setUtilizationLoading(true);
        setUtilizationError(null);
        try {
            const response = await adminApi.getTrainUtilizationSource(filters);
            setUtilizationData(response.data);
        } catch (error) {
            setUtilizationError(error.message);
        } finally {
            setUtilizationLoading(false);
        }
    };

    const fetchRoutesData = async () => {
        setRoutesLoading(true);
        setRoutesError(null);
        try {
            const response = await adminApi.getPopularRouteDerivation(filters);
            setRoutesData(response.data);
        } catch (error) {
            setRoutesError(error.message);
        } finally {
            setRoutesLoading(false);
        }
    };

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === "revenue") {
            fetchRevenueData();
        } else if (activeTab === "utilization") {
            fetchUtilizationData();
        } else if (activeTab === "routes") {
            fetchRoutesData();
        }
    }, [activeTab, filters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            date_from: "",
            date_to: "",
            route_id: "",
            train_id: "",
        });
    };

    const handleApplyFilters = () => {
        if (activeTab === "revenue") {
            fetchRevenueData();
        } else if (activeTab === "utilization") {
            fetchUtilizationData();
        } else if (activeTab === "routes") {
            fetchRoutesData();
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const tabs = [
        {
            id: "revenue",
            name: "Revenue Sources",
            icon: CurrencyDollarIcon,
            description: "Track which bookings and payments contributed to revenue",
            count: revenueData?.data?.count || 0,
        },
        {
            id: "utilization",
            name: "Train Utilization",
            icon: ChartBarIcon,
            description: "See which schedules and bookings drove train usage",
            count: utilizationData?.data?.count || 0,
        },
        {
            id: "routes",
            name: "Popular Routes",
            icon: MapIcon,
            description: "Understand what made routes popular",
            count: routesData?.data?.count || 0,
        },
    ];

    const renderRevenueData = () => {
        if (revenueLoading) return <LoadingSpinner />;
        if (revenueError) return <EmptyState message="Failed to load revenue data" />;
        if (!revenueData?.data?.length) return <EmptyState message="No revenue data found" />;

        return (
            <div className="space-y-4">
                {revenueData.data.map((item, index) => (
                    <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-900">Payment Details</h4>
                                <p className="text-sm text-gray-600">ID: {item.PAYMENT_ID}</p>
                                <p className="text-sm text-gray-600">Amount: {formatCurrency(item.AMOUNT)}</p>
                                <p className="text-sm text-gray-600">Status: {item.PAYMENT_STATUS}</p>
                                <p className="text-sm text-gray-600">Date: {formatDate(item.PAYMENT_DATE)}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Booking Details</h4>
                                <p className="text-sm text-gray-600">Reference: {item.BOOKING_REFERENCE}</p>
                                <p className="text-sm text-gray-600">Passenger: {item.PASSENGER_NAME}</p>
                                <p className="text-sm text-gray-600">Reservation ID: {item.RESERVATION_ID}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Route Details</h4>
                                <p className="text-sm text-gray-600">Route: {item.ROUTE_NAME}</p>
                                <p className="text-sm text-gray-600">Train: {item.TRAIN_NAME}</p>
                                <p className="text-sm text-gray-600">
                                    {item.DEPARTURE_STATION} → {item.ARRIVAL_STATION}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {formatDateTime(item.DEPARTURE_TIME)} - {formatDateTime(item.ARRIVAL_TIME)}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    const renderUtilizationData = () => {
        if (utilizationLoading) return <LoadingSpinner />;
        if (utilizationError) return <EmptyState message="Failed to load utilization data" />;
        if (!utilizationData?.data?.data?.length) return <EmptyState message="No utilization data found" />;

        return (
            <div className="space-y-4">
                {utilizationData.data.data.map((item, index) => (
                    <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-900">Schedule Details</h4>
                                <p className="text-sm text-gray-600">Schedule ID: {item.SCHEDULE_ID}</p>
                                <p className="text-sm text-gray-600">Departure: {formatDateTime(item.DEPARTURE_TIME)}</p>
                                <p className="text-sm text-gray-600">Arrival: {formatDateTime(item.ARRIVAL_TIME)}</p>
                                <p className="text-sm text-gray-600">Status: {item.SCHEDULE_STATUS}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Train Details</h4>
                                <p className="text-sm text-gray-600">Train: {item.TRAIN_NAME}</p>
                                <p className="text-sm text-gray-600">Type: {item.TRAIN_TYPE}</p>
                                <p className="text-sm text-gray-600">Capacity: {item.CAPACITY}</p>
                                <p className="text-sm text-gray-600">Bookings: {item.BOOKING_COUNT}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Route Details</h4>
                                <p className="text-sm text-gray-600">Route: {item.ROUTE_NAME}</p>
                                <p className="text-sm text-gray-600">
                                    {item.DEPARTURE_STATION} → {item.ARRIVAL_STATION}
                                </p>
                                <p className="text-sm text-gray-600">Utilization: {item.UTILIZATION_PERCENTAGE}%</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    const renderRoutesData = () => {
        if (routesLoading) return <LoadingSpinner />;
        if (routesError) return <EmptyState message="Failed to load routes data" />;
        if (!routesData?.data?.data?.length) return <EmptyState message="No routes data found" />;

        return (
            <div className="space-y-4">
                {routesData.data.data.map((item, index) => (
                    <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-900">Route Details</h4>
                                <p className="text-sm text-gray-600">Route: {item.ROUTE_NAME}</p>
                                <p className="text-sm text-gray-600">Code: {item.ROUTE_CODE}</p>
                                <p className="text-sm text-gray-600">Distance: {item.DISTANCE} km</p>
                                <p className="text-sm text-gray-600">Duration: {item.DURATION} min</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Popularity Metrics</h4>
                                <p className="text-sm text-gray-600">Total Bookings: {item.TOTAL_BOOKINGS}</p>
                                <p className="text-sm text-gray-600">Revenue: {formatCurrency(item.TOTAL_REVENUE)}</p>
                                <p className="text-sm text-gray-600">Avg Rating: {item.AVG_RATING || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Popularity Score: {item.POPULARITY_SCORE}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Route Info</h4>
                                <p className="text-sm text-gray-600">
                                    {item.DEPARTURE_STATION} → {item.ARRIVAL_STATION}
                                </p>
                                <p className="text-sm text-gray-600">Stations: {item.STATION_COUNT}</p>
                                <p className="text-sm text-gray-600">Active: {item.IS_ACTIVE === 'Y' ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Data Lineage</h1>
                        <p className="text-gray-600 mt-1">
                            Track the source and flow of data across your railway system
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <FunnelIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Route ID
                            </label>
                            <input
                                type="text"
                                value={filters.route_id}
                                onChange={(e) => handleFilterChange("route_id", e.target.value)}
                                placeholder="Enter route ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Train ID
                            </label>
                            <input
                                type="text"
                                value={filters.train_id}
                                onChange={(e) => handleFilterChange("train_id", e.target.value)}
                                placeholder="Enter train ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                        ? "border-primary-500 text-primary-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{tab.name}</span>
                                    <Badge className="bg-gray-100 text-gray-600">
                                        {tab.count}
                                    </Badge>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {tabs.map((tab) => (
                        <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{tab.name}</h3>
                                <p className="text-gray-600">{tab.description}</p>
                            </div>
                            {activeTab === "revenue" && renderRevenueData()}
                            {activeTab === "utilization" && renderUtilizationData()}
                            {activeTab === "routes" && renderRoutesData()}
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
