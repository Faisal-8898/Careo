"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery } from "react-query";
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
import { auditApi } from "../../../services/api";
import {
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";

export default function AdminAuditPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState("summary");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.userType !== "admin")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Fetch audit summary - matches backend /api/audit/summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery(
    ["audit-summary", dateFrom, dateTo],
    () => auditApi.getSummary({ date_from: dateFrom, date_to: dateTo }),
    {
      enabled:
        isAuthenticated &&
        user?.userType === "admin" &&
        selectedTab === "summary",
      select: (data) => data.data.data,
    }
  );

  // Fetch audit trails based on selected table - matches backend controllers exactly
  const {
    data: auditData,
    isLoading: auditLoading,
    error,
  } = useQuery(
    [
      "audit-trail",
      selectedTable,
      selectedOperation,
      dateFrom,
      dateTo,
      currentPage,
    ],
    async () => {
      const params = {
        page: currentPage,
        limit: 20,
        operation_type: selectedOperation || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      // Call the appropriate backend endpoint based on selected table
      switch (selectedTable) {
        case "trains":
          return auditApi.getTrainAudit(params);
        case "schedules":
          return auditApi.getScheduleAudit(params);
        case "passengers":
          return auditApi.getPassengerAudit(params);
        case "payments":
          return auditApi.getPaymentAudit(params);
        default:
          return null;
      }
    },
    {
      enabled:
        isAuthenticated &&
        user?.userType === "admin" &&
        selectedTab === "trails" &&
        selectedTable,
      select: (data) => data?.data,
    }
  );

  // Fetch user actions - matches backend /api/audit/user/:userId
  const { data: userAuditData, isLoading: userAuditLoading } = useQuery(
    ["user-audit", selectedUserId, dateFrom, dateTo, currentPage],
    () =>
      auditApi.getAuditByUser(selectedUserId, {
        page: currentPage,
        limit: 20,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    {
      enabled:
        isAuthenticated &&
        user?.userType === "admin" &&
        selectedTab === "users" &&
        selectedUserId,
      select: (data) => data.data,
    }
  );

  if (isLoading) {
    return <FullPageSpinner message="Loading audit system..." />;
  }

  if (!isAuthenticated || user?.userType !== "admin") {
    return null;
  }

  const tabs = [
    { id: "summary", name: "Summary", icon: ChartBarIcon },
    { id: "trails", name: "Audit Trails", icon: DocumentTextIcon },
    { id: "users", name: "User Actions", icon: UserIcon },
  ];

  const tableOptions = [
    { value: "", label: "Select Table" },
    { value: "trains", label: "Trains" },
    { value: "schedules", label: "Schedules" },
    { value: "passengers", label: "Passengers/Reservations" },
    { value: "payments", label: "Payments" },
  ];

  const operationOptions = [
    { value: "", label: "All Operations" },
    { value: "INSERT", label: "Created" },
    { value: "UPDATE", label: "Updated" },
    { value: "DELETE", label: "Deleted" },
  ];

  const getProvenanceTypeColor = (provenanceType) => {
    if (provenanceType?.includes("WHY")) return "bg-purple-100 text-purple-800";
    if (provenanceType?.includes("WHERE")) return "bg-blue-100 text-blue-800";
    if (provenanceType?.includes("HOW")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getOperationColor = (operation) => {
    switch (operation) {
      case "INSERT":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <Layout>
        <ErrorState
          title="Failed to load audit data"
          description="There was an error loading the audit information. Please try again."
          onRetry={() => window.location.reload()}
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
              Audit Trail & Provenance
            </h1>
            <p className="text-sm text-gray-600">
              Track WHY, WHERE, and HOW data changes in the system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="info" className="bg-purple-100 text-purple-800">
              WHY Provenance
            </Badge>
            <Badge variant="info" className="bg-blue-100 text-blue-800">
              WHERE Provenance
            </Badge>
            <Badge variant="info" className="bg-green-100 text-green-800">
              HOW Provenance
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`${
                    selectedTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date From */}
              <div>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {/* Table Filter (for trails tab) */}
              {selectedTab === "trails" && (
                <div>
                  <label className="form-label">Table</label>
                  <select
                    className="form-input"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                  >
                    {tableOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Operation Filter */}
              {selectedTab === "trails" && (
                <div>
                  <label className="form-label">Operation</label>
                  <select
                    className="form-input"
                    value={selectedOperation}
                    onChange={(e) => setSelectedOperation(e.target.value)}
                  >
                    {operationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* User ID Filter (for users tab) */}
              {selectedTab === "users" && (
                <div>
                  <label className="form-label">User ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter user ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content based on selected tab */}
        {selectedTab === "summary" && (
          <div className="space-y-6">
            {summaryLoading ? (
              <Card>
                <div className="p-6">
                  <InlineSpinner text="Loading audit summary..." />
                </div>
              </Card>
            ) : (
              <>
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {summaryData?.summary_by_table &&
                    Object.entries(summaryData.summary_by_table).map(
                      ([table, operations]) => (
                        <Card key={table}>
                          <CardHeader>
                            <CardTitle className="capitalize">
                              {table} Audit
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {Object.entries(operations).map(
                                ([operation, count]) => (
                                  <div
                                    key={operation}
                                    className="flex justify-between items-center"
                                  >
                                    <Badge
                                      size="sm"
                                      className={getOperationColor(operation)}
                                    >
                                      {operation}
                                    </Badge>
                                    <span className="font-semibold">
                                      {count}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                </div>

                {/* Top Active Users */}
                {summaryData?.top_active_users && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Most Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {summaryData.top_active_users.map(
                          (userActivity, index) => (
                            <div
                              key={userActivity.USER_ID}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary-600">
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {userActivity.USER_ID}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    User ID
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {userActivity.TOTAL_ACTIONS}
                                </p>
                                <p className="text-sm text-gray-600">actions</p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {selectedTab === "trails" && (
          <div className="space-y-6">
            {!selectedTable ? (
              <Card>
                <div className="p-6 text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-600">
                    Select a table to view audit trails
                  </p>
                </div>
              </Card>
            ) : auditLoading ? (
              <Card>
                <div className="p-6">
                  <InlineSpinner text="Loading audit trails..." />
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">
                      {selectedTable} Audit Trail
                    </CardTitle>
                    {auditData?.provenance_type && (
                      <Badge
                        className={getProvenanceTypeColor(
                          auditData.provenance_type
                        )}
                      >
                        {auditData.provenance_type}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {auditData?.data && auditData.data.length > 0 ? (
                    <div className="space-y-4">
                      {auditData.data.map((record, index) => (
                        <div
                          key={record.AUDIT_ID || index}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge
                                  className={getOperationColor(
                                    record.OPERATION_TYPE
                                  )}
                                >
                                  {record.OPERATION_TYPE}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  by {record.USER_ID}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {format(
                                    parseISO(record.AUDIT_TIMESTAMP),
                                    "MMM dd, yyyy HH:mm:ss"
                                  )}
                                </span>
                              </div>
                              {record.CHANGE_REASON && (
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Reason:</strong>{" "}
                                  {record.CHANGE_REASON}
                                </p>
                              )}
                              <div className="text-xs text-gray-500">
                                Audit ID: {record.AUDIT_ID}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/audit/${selectedTable}/${record.AUDIT_ID}`
                                )
                              }
                              className="p-2 text-gray-400 hover:text-primary-600"
                              title="View details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-gray-600">
                        No audit records found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedTab === "users" && (
          <div className="space-y-6">
            {!selectedUserId ? (
              <Card>
                <div className="p-6 text-center">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-600">
                    Enter a user ID to view their actions
                  </p>
                </div>
              </Card>
            ) : userAuditLoading ? (
              <Card>
                <div className="p-6">
                  <InlineSpinner text="Loading user actions..." />
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Actions by User: {selectedUserId}</CardTitle>
                  {userAuditData?.provenance_type && (
                    <p className="text-sm text-gray-600 mt-1">
                      {userAuditData.provenance_type}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {userAuditData?.data && userAuditData.data.length > 0 ? (
                    <div className="space-y-4">
                      {userAuditData.data.map((action, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge
                                className={getOperationColor(
                                  action.OPERATION_TYPE
                                )}
                              >
                                {action.OPERATION_TYPE}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {action.TABLE_NAME}
                              </span>
                              <span className="text-sm text-gray-600">
                                Entity ID: {action.ENTITY_ID}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-900">
                                {format(
                                  parseISO(action.AUDIT_TIMESTAMP),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(
                                  parseISO(action.AUDIT_TIMESTAMP),
                                  "HH:mm:ss"
                                )}
                              </p>
                            </div>
                          </div>
                          {action.CHANGE_REASON && (
                            <p className="text-sm text-gray-700 mt-2">
                              <strong>Reason:</strong> {action.CHANGE_REASON}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-gray-600">
                        No actions found for this user
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
