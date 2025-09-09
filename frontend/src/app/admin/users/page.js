'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '../../../components/Layout/Layout';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/UI/Card';
import Badge from '../../../components/UI/Badge';
import { FullPageSpinner, InlineSpinner } from '../../../components/UI/LoadingSpinner';
import { ErrorState } from '../../../components/UI/EmptyState';
import { adminApi } from '../../../services/api';
import {
    UsersIcon,
    UserIcon,
    ShieldCheckIcon,
    EyeIcon,
    PencilIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    UserPlusIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

export default function AdminUsersPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // State for filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [userType, setUserType] = useState('');
    const [status, setStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Redirect if not authenticated or not an admin
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.userType !== 'admin')) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, user, isLoading, router]);

    // Fetch users data
    const { data: usersData, isLoading: usersLoading, error, refetch } = useQuery(
        ['admin-users', currentPage, userType, status],
        () => adminApi.getAllUsers({
            page: currentPage,
            limit: 20,
            user_type: userType || undefined,
            status: status || undefined,
        }),
        {
            enabled: Boolean(isAuthenticated && user?.userType === 'admin'),
            select: (data) => data.data,
        }
    );

    // Update user status mutation
    const updateUserStatusMutation = useMutation(
        ({ userId, status, userType }) => adminApi.updateUserStatus(userId, { status, user_type: userType }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('admin-users');
                setShowUserModal(false);
                setSelectedUser(null);
            },
            onError: (error) => {
                console.error('Failed to update user status:', error);
            },
        }
    );

    // Get user details mutation
    const getUserDetailsMutation = useMutation(
        (userId) => adminApi.getUserById(userId),
        {
            onSuccess: (data) => {
                setSelectedUser(data.data.data);
                setShowUserModal(true);
            },
            onError: (error) => {
                console.error('Failed to get user details:', error);
            },
        }
    );

    const handleViewUser = (userId, userType) => {
        getUserDetailsMutation.mutate(userId);
    };

    const handleUpdateStatus = (userId, newStatus, userType) => {
        updateUserStatusMutation.mutate({ userId, status: newStatus, userType });
    };

    const handleRefresh = () => {
        refetch();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'INACTIVE':
                return 'bg-gray-100 text-gray-800';
            case 'SUSPENDED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getUserTypeColor = (userType) => {
        switch (userType) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'passenger':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusOptions = (currentStatus) => {
        const allStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        return allStatuses.filter(s => s !== currentStatus);
    };

    if (isLoading) {
        return <FullPageSpinner message="Loading users management..." />;
    }

    if (!isAuthenticated || user?.userType !== 'admin') {
        return null;
    }

    if (error) {
        return (
            <Layout>
                <ErrorState
                    title="Failed to load users"
                    description="There was an error loading the users data. Please try again."
                    onRetry={handleRefresh}
                />
            </Layout>
        );
    }

    const users = usersData?.data || [];
    const pagination = usersData?.pagination || {};

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-600">
                            Manage passengers and admin users in the system
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={usersLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                            <span className="text-sm font-medium">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="form-label">Search</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        className="form-input pl-10"
                                        placeholder="Search by name, email, or username..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* User Type Filter */}
                            <div>
                                <label className="form-label">User Type</label>
                                <select
                                    className="form-input"
                                    value={userType}
                                    onChange={(e) => setUserType(e.target.value)}
                                >
                                    <option value="">All Users</option>
                                    <option value="passenger">Passengers</option>
                                    <option value="admin">Admins</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setUserType('');
                                        setStatus('');
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Users ({pagination.total || 0})</CardTitle>
                            <div className="flex items-center space-x-2">
                                <FunnelIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    Page {pagination.page || 1} of {Math.ceil((pagination.total || 0) / (pagination.limit || 20))}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {usersLoading ? (
                            <div className="p-6">
                                <InlineSpinner text="Loading users..." />
                            </div>
                        ) : users.length > 0 ? (
                            <div className="space-y-4">
                                {users.map((user) => (
                                    <div
                                        key={`${user.USER_TYPE}-${user.ID}`}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                                                    {user.USER_TYPE === 'admin' ? (
                                                        <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                                                    ) : (
                                                        <UserIcon className="h-6 w-6 text-primary-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {user.FULL_NAME || user.USERNAME}
                                                        </h3>
                                                        <Badge className={getUserTypeColor(user.USER_TYPE)}>
                                                            {user.USER_TYPE}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{user.EMAIL}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Username: {user.USERNAME} • ID: {user.ID}
                                                    </p>
                                                    {user.USER_TYPE === 'admin' && user.ROLE && (
                                                        <p className="text-xs text-gray-500">Role: {user.ROLE}</p>
                                                    )}
                                                    {user.USER_TYPE === 'passenger' && user.PHONE && (
                                                        <p className="text-xs text-gray-500">Phone: {user.PHONE}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        Joined: {format(parseISO(user.CREATED_AT), 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Badge className={getStatusColor(user.STATUS)}>
                                                    {user.STATUS}
                                                </Badge>
                                                <button
                                                    onClick={() => handleViewUser(user.ID, user.USER_TYPE)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                                                    title="View details"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Try adjusting your filters or search terms.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination.total > (pagination.limit || 20) && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.page || 1) - 1) * (pagination.limit || 20) + 1} to{' '}
                            {Math.min((pagination.page || 1) * (pagination.limit || 20), pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage <= 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm font-medium text-gray-700">
                                Page {currentPage}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= Math.ceil(pagination.total / (pagination.limit || 20))}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* User Details Modal */}
                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        User Details
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowUserModal(false);
                                            setSelectedUser(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedUser.FULL_NAME || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Username</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedUser.USERNAME}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedUser.EMAIL}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">User Type</label>
                                            <Badge className={getUserTypeColor(selectedUser.USER_TYPE)}>
                                                {selectedUser.USER_TYPE}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <Badge className={getStatusColor(selectedUser.STATUS)}>
                                                {selectedUser.STATUS}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Created</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {format(parseISO(selectedUser.CREATED_AT), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedUser.USER_TYPE === 'admin' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Role</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedUser.ROLE || 'N/A'}</p>
                                        </div>
                                    )}

                                    {selectedUser.USER_TYPE === 'passenger' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.PHONE || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {selectedUser.DATE_OF_BIRTH ? format(parseISO(selectedUser.DATE_OF_BIRTH), 'MMM dd, yyyy') : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedUser.GENDER && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.GENDER}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {selectedUser.STATISTICS && (
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Total Bookings</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.STATISTICS.TOTAL_BOOKINGS || 0}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Confirmed Bookings</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.STATISTICS.CONFIRMED_BOOKINGS || 0}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Cancelled Bookings</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedUser.STATISTICS.CANCELLED_BOOKINGS || 0}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Total Spent</label>
                                                    <p className="mt-1 text-sm text-gray-900">৳{selectedUser.STATISTICS.TOTAL_SPENT?.toLocaleString() || '0'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">Current Status:</span>
                                            <Badge className={`ml-2 ${getStatusColor(selectedUser.STATUS)}`}>
                                                {selectedUser.STATUS}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => {
                                                    setShowUserModal(false);
                                                    setSelectedUser(null);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">Change to:</span>
                                                {getStatusOptions(selectedUser.STATUS).map((newStatus) => (
                                                    <button
                                                        key={newStatus}
                                                        onClick={() => handleUpdateStatus(selectedUser.ID, newStatus, selectedUser.USER_TYPE)}
                                                        disabled={updateUserStatusMutation.isLoading}
                                                        className="px-3 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{
                                                            backgroundColor: newStatus === 'ACTIVE' ? '#16a34a' :
                                                                newStatus === 'INACTIVE' ? '#6b7280' : '#dc2626'
                                                        }}
                                                    >
                                                        {updateUserStatusMutation.isLoading ? 'Updating...' : newStatus}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
