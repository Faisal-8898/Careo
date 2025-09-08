# Careo Frontend - Train Ticket Management System

A modern, responsive frontend built with **Next.js 14** and **Tailwind CSS** for the Careo train ticket management system.

## 🎨 Design & UI Features

### Beautiful Tailwind CSS Styling
- **Modern Design System**: Comprehensive design tokens with custom color palette
- **Responsive Layout**: Mobile-first design that works perfectly on all devices
- **Component Library**: Reusable UI components with consistent styling
- **Smooth Animations**: Subtle transitions and micro-interactions
- **Dark/Light Theme Ready**: Built with theme support in mind

### Key UI Components
- **Layout System**: Professional sidebar navigation with responsive header
- **Authentication Pages**: Beautiful split-screen login/register forms
- **Dashboard**: Clean, card-based layouts with statistics and quick actions
- **Data Tables**: Responsive tables with sorting and filtering
- **Forms**: Well-designed forms with validation feedback
- **Status Badges**: Color-coded status indicators for trains, bookings, payments
- **Loading States**: Elegant loading spinners and skeleton screens
- **Empty States**: Thoughtful empty state designs with call-to-actions

## 🚀 Features

### For Passengers
- **Home Page**: Hero section with train search and feature highlights
- **Train Search**: Real-time search with filters and route suggestions
- **Booking System**: Step-by-step booking process with seat selection
- **Dashboard**: Personal dashboard with upcoming trips and booking history
- **Payment Management**: Secure payment processing with multiple methods
- **Profile Management**: User profile and settings management

### For Admins
- **Admin Dashboard**: Comprehensive overview with key metrics and analytics
- **Train Management**: CRUD operations for trains, routes, and stations
- **Schedule Management**: Create and manage train schedules
- **User Management**: Manage passengers and admin accounts
- **Booking Management**: View and manage all reservations
- **Reports & Analytics**: Revenue reports, booking analytics, train utilization
- **Audit Trail**: Complete provenance tracking with WHY/WHERE/HOW data

### Advanced Features
- **Real-time Updates**: Live data updates using React Query
- **Provenance Tracking**: Complete audit trail visualization
- **Search & Filtering**: Advanced search across all entities
- **Data Export**: Export reports and data in various formats
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile

## 🛠 Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, Context API for auth
- **UI Components**: Custom component library with Headless UI
- **Icons**: Heroicons (outline & solid variants)
- **Forms**: React Hook Form with validation
- **Notifications**: React Hot Toast
- **Authentication**: JWT-based with cookies
- **API Client**: Axios with interceptors
- **Date Handling**: date-fns
- **Charts**: Recharts for analytics

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # User dashboard
│   ├── search/            # Train search
│   ├── admin/             # Admin pages
│   │   ├── dashboard/
│   │   ├── trains/
│   │   ├── users/
│   │   └── audit/
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/            # Reusable components
│   ├── Layout/            # Layout components
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Layout.js
│   └── UI/                # UI component library
│       ├── Badge.js
│       ├── Card.js
│       ├── LoadingSpinner.js
│       └── EmptyState.js
├── contexts/              # React contexts
│   └── AuthContext.js     # Authentication context
├── services/              # API services
│   └── api.js             # Axios client & API methods
└── utils/                 # Utility functions
    └── auth.js            # Auth utilities
```

## 🎯 Component Architecture

### Design System
All components follow a consistent design system:

```javascript
// Color Palette
primary: {
  50: '#eff6ff',   // Light backgrounds
  100: '#dbeafe',  // Soft highlights
  500: '#3b82f6',  // Primary brand
  600: '#2563eb',  // Primary hover
  700: '#1d4ed8',  // Primary active
}

// Component Patterns
.btn-primary     // Primary buttons
.btn-secondary   // Secondary buttons
.form-input      // Form inputs
.card           // Content cards
.badge          // Status badges
```

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large**: > 1280px

## 🔧 API Integration

The frontend integrates seamlessly with the backend:

### Authentication
- JWT-based authentication with automatic token refresh
- Role-based access control (Passenger/Admin)
- Secure cookie storage

### Data Management
- Real-time data fetching with React Query
- Optimistic updates for better UX
- Automatic error handling and retry logic

### API Structure
```javascript
// Example API usage
import { reservationsApi } from '../services/api';

// Get user's bookings
const { data } = useQuery('bookings', reservationsApi.getAll);

// Create new booking
const createBooking = useMutation(reservationsApi.create);
```

## 🎨 Styling Philosophy

### Tailwind CSS Best Practices
1. **Utility-First**: Use Tailwind utilities for rapid development
2. **Component Extraction**: Extract common patterns into reusable components
3. **Custom Utilities**: Extended Tailwind with custom utilities for consistency
4. **Responsive Design**: Mobile-first approach with responsive variants
5. **Design Tokens**: Consistent spacing, colors, and typography

### Color Strategy
- **Primary Blue**: Brand identity and primary actions
- **Gray Scale**: Text hierarchy and backgrounds
- **Semantic Colors**: Green (success), Red (error), Yellow (warning), Blue (info)
- **Status Colors**: Train, booking, and payment status indicators

## 📱 Responsive Features

### Mobile Optimizations
- Collapsible sidebar navigation
- Touch-friendly button sizes
- Optimized form layouts
- Swipe gestures support

### Tablet Experience
- Grid layouts that adapt to screen size
- Optimized spacing for touch interaction
- Readable typography scales

### Desktop Experience
- Full sidebar navigation
- Multi-column layouts
- Hover states and interactions
- Keyboard navigation support

## 🔒 Security Features

- **XSS Protection**: Sanitized inputs and outputs
- **CSRF Protection**: Token-based request validation
- **Secure Authentication**: HTTP-only cookies for token storage
- **Role-based Access**: Protected routes and components
- **Input Validation**: Client and server-side validation

## 📊 Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component
- **Caching**: React Query for intelligent data caching
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Lazy Loading**: Component-level lazy loading

## 🌟 User Experience Features

### Micro-interactions
- Smooth hover transitions
- Loading state animations
- Form validation feedback
- Success/error toast notifications

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management

### Progressive Enhancement
- Works without JavaScript
- Graceful degradation
- Offline support (coming soon)

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🎯 Key Pages Overview

### Home Page (`/`)
- Hero section with search functionality
- Feature highlights with icons
- Statistics showcase
- Call-to-action sections

### Authentication (`/auth/login`, `/auth/register`)
- Split-screen design with imagery
- Form validation with real-time feedback
- Role selection (Passenger/Admin)
- Demo credentials display

### Passenger Dashboard (`/dashboard`)
- Welcome message with user context
- Statistics cards (bookings, spending)
- Upcoming trips section
- Quick action buttons
- Recent activity feed

### Admin Dashboard (`/admin/dashboard`)
- System overview with key metrics
- Real-time statistics
- Recent bookings and activities
- Popular routes analysis
- System status monitoring
- Quick management actions

### Train Search (`/search`)
- Advanced search form with autocomplete
- Real-time results with filtering
- Route suggestions
- Booking integration
- Mobile-optimized layout

This frontend provides a complete, production-ready interface for the train ticket management system with beautiful Tailwind CSS styling and excellent user experience.