"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import clsx from "clsx";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Public navigation items
  const publicNavigation = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Search Trains",
      href: "/search",
    },
    {
      name: "Stations",
      href: "/stations",
    },
    {
      name: "Routes",
      href: "/routes",
    },
  ];

  // Passenger navigation items
  const passengerNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Search Trains",
      href: "/search",
    },
    {
      name: "My Bookings",
      href: "/bookings",
    },
    {
      name: "Payments",
      href: "/payments",
    },
  ];

  // Admin navigation items
  const adminNavigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      name: "Management",
      children: [
        { name: "Stations", href: "/admin/stations" },
        { name: "Routes", href: "/admin/routes" },
        { name: "Trains", href: "/admin/trains" },
        { name: "Schedules", href: "/admin/schedules" },
      ],
    },
    {
      name: "Bookings",
      href: "/admin/bookings",
    },
    {
      name: "Payments",
      href: "/admin/payments",
    },
    {
      name: "Users",
      href: "/admin/users",
    },
    {
      name: "Reports",
      children: [
        { name: "Booking Reports", href: "/admin/reports/bookings" },
        { name: "Revenue Reports", href: "/admin/reports/revenue" },
        { name: "Train Utilization", href: "/admin/reports/trains" },
      ],
    },
    {
      name: "Data Lineage",
      href: "/admin/lineage",
    },
    {
      name: "Audit Trail",
      href: "/admin/audit",
    },
  ];

  const getNavigation = () => {
    if (!isAuthenticated) return publicNavigation;
    if (user?.userType === "admin") return adminNavigation;
    return passengerNavigation;
  };

  const isActive = (href) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  const hasActiveChild = (children) => {
    return children?.some((child) => isActive(child.href));
  };

  const renderNavItem = (item, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.name];
    const hasActiveChildren = hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleSection(item.name)}
            className={clsx(
              "group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200",
              hasActiveChildren
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center">{item.name}</div>
            <svg
              className={clsx(
                "h-4 w-4 transition-transform duration-200",
                isExpanded ? "rotate-90" : "",
                hasActiveChildren ? "text-primary-600" : "text-gray-400"
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={clsx(
                    "group flex items-center rounded-md py-2 pl-11 pr-2 text-sm font-medium transition-colors duration-200",
                    isActive(child.href)
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={clsx(
          "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200",
          active
            ? "bg-primary-50 text-primary-700"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none lg:relative lg:flex lg:flex-col",
          "fixed inset-y-0 left-0 z-50 lg:static lg:inset-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center" onClick={onClose}>
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Careo
              </span>
            </Link>
            <button
              type="button"
              className="lg:hidden rounded-md p-2 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
            {getNavigation().map((item) => renderNavItem(item))}
          </nav>

          {/* Footer */}
          {isAuthenticated && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.userType}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
