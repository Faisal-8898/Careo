"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    userType: "passenger",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disable automatic redirect - we'll handle it manually in handleSubmit
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const redirectPath =
  //       formData.userType === "admin" ? "/admin/dashboard" : "/dashboard";
  //     router.push(redirectPath);
  //   }
  // }, [isAuthenticated, router, formData.userType]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted, preventing default');
    setIsSubmitting(true);

    try {
      const { userType, ...credentials } = formData;
      console.log('Attempting login with:', { userType, username: credentials.username });

      const result = await login(credentials, userType);
      console.log('Login result:', result);

      if (result.success) {
        // Show success toast with longer duration and wait for it
        toast.success("Login successful! Redirecting...", {
          duration: 2000,
        });

        // Wait for toast to be visible before redirect (2 seconds)
        setTimeout(() => {
          const redirectPath =
            userType === "admin" ? "/admin/dashboard" : "/dashboard";
          router.push(redirectPath);
        }, 2000);
      } else {
        // Show error toast with longer duration
        toast.error("Login failed. Please try again.", {
          duration: 6000,
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("An unexpected error occurred. Please try again.", {
        duration: 6000,
      });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-100">
                Careo
              </span>
            </Link>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-400">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <Link
                href="/auth/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                create a new account
              </Link>
            </p>
          </div>

          <div className="mt-8 ">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* User Type Selection */}
              <div>
                <label className="form-label ">Sign in as</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, userType: "passenger" })
                    }
                    className={`${formData.userType === "passenger"
                      ? "bg-primary-50 border-primary-600 text-primary-600"
                      : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"
                      } relative rounded-lg border p-4 flex flex-col items-center justify-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200`}
                  >
                    <svg
                      className="h-8 w-8 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, userType: "admin" })
                    }
                    className={`${formData.userType === "admin"
                      ? "bg-primary-50 border-primary-600 text-primary-600"
                      : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"
                      } relative rounded-lg border p-4 flex flex-col items-center justify-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200`}
                  >
                    <svg
                      className="h-8 w-8 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Admin
                  </button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="mt-2">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="form-input text-black"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="form-input pr-10 text-black"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-3 block text-sm text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <a
                    href="#"
                    className="font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                Demo Credentials
              </h4>
              <div className="text-xs text-amber-700 space-y-1">
                <div>
                  <strong>Admin:</strong> username: admin, password: admin123
                </div>
                <div>
                  <strong>Passenger:</strong> username: john_doe, password:
                  password123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"></div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="max-w-md text-center text-white">
            <svg
              className="h-20 w-20 mx-auto mb-8 text-white opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <h3 className="text-3xl font-bold mb-4">Welcome to Careo</h3>
            <p className="text-lg text-primary-100 leading-relaxed">
              Experience seamless train travel with our advanced booking
              platform. Join thousands of satisfied passengers who trust us for
              their journey.
            </p>
            <div className="mt-8 space-y-2 text-primary-200">
              <div className="flex items-center justify-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Real-time booking
              </div>
              <div className="flex items-center justify-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure payments
              </div>
              <div className="flex items-center justify-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Comprehensive audit trails
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
