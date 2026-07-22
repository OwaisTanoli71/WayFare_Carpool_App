# Wayfare 🚗

**A real time carpool platform for safe, verified, gender matched ride sharing in city and intercity.**

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime%20Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?style=flat-square&logo=framer&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

***

## 📖 Overview

**Wayfare** is a full featured, enterprise grade carpool web application built for riders and drivers seeking a safer, verified, community driven ride sharing experience. It supports gender matched ride preferences, verified user profiles, real time in app chat, trusted contacts, SOS safety alerts, an AI Route and Fare Assistant, 5 minute inactivity auto logout security, and a Super Admin dashboard with real time WebSocket activity logs. Everything is packaged in an installable Progressive Web App (PWA).

***

## ✨ Key Features

* 🔐 **Authentication and Security**: Secure signup and login via Supabase Auth with 5 minute inactivity session timeout protection and password strength limits.
* 🧑‍🤝‍🧑 **Verified Profiles and Driver Approval**: Document verification flow for drivers including CNIC, Driver License, and Vehicle Registration.
* 🚘 **Post and Find Rides**: Create ride offers or search available rides by route for in city and intercity travel with strict gender preference filters.
* 💬 **Real Time Chat**: Instant messaging between riders and drivers powered by Supabase Realtime subscriptions.
* 🤖 **Wayfare AI Assistant**: Integrated Lumo.ai styled chatbot assistant for route calculations, fare splitting, and platform safety guidance.
* 🛡️ **Safety Center and Emergency Response**: SOS panic button, trusted emergency contacts, and live activity trackers.
* 👑 **Super Admin Portal**: Executive overview dashboard, user management, real time audit activity logs, and admin promotion locks.
* 👥 **Ride Circles**: Save and prioritize recurring, trusted driver matches.
* 💰 **Earnings Analytics**: Driver income tracking, trip history, and financial metrics.
* 📱 **Installable PWA**: Offline support, installable on iOS, Android, and Desktop devices.

***

## 🧰 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 5 |
| **Styling** | Tailwind CSS 3, Modern Obsidian Design Token System |
| **Typography** | Google Fonts: **Outfit** and **Plus Jakarta Sans** |
| **Animations** | Framer Motion |
| **Routing** | React Router DOM 6 |
| **Backend and Database** | Supabase (PostgreSQL, Realtime WebSockets, RLS Auth) |
| **Icons** | Lucide React |
| **PWA** | `vite-plugin-pwa` and Workbox |

***

## 📁 Project Structure

```
WayFare_Carpool_App/
├── src/
│   ├── components/       # UI components (HelpWidget, InactivityTracker, RideCard, SOSButton)
│   ├── pages/            # Route pages (Dashboard, AdminDashboard, FindRide, PostRide, Chat, Verification)
│   ├── context/          # Global application state (AppContext)
│   ├── hooks/            # Custom React hooks (useTripTracker)
│   ├── lib/              # Supabase client and SOS helper utilities
│   ├── data/             # Mock data and route lists
│   ├── App.jsx           # Application routing and global provider wrappers
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global typography and Tailwind directives
├── public/               # Logos, favicons, and PWA webmanifest assets
├── supabase/             # Edge functions and database migrations
├── supabase-schema.sql   # Primary PostgreSQL tables and indexes
├── supabase-schema-update.sql # Activity logs and verification tables
├── tailwind.config.js    # Custom typography and color design tokens
└── vite.config.js        # Vite and PWA build configuration
```

***

## 🚀 Getting Started

### Prerequisites

* Node.js version 18 or higher
* npm package manager
* A free Supabase account

***

### 1. Clone the Repository

```bash
git clone https://github.com/OwaisTanoli71/WayFare_Carpool_App.git
cd WayFare_Carpool_App
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

***

### 4. Database Setup (Supabase SQL)

1. Open your Supabase Dashboard, go to **SQL Editor**.
2. Run the SQL schema script in `supabase-schema.sql`.
3. Run the schema update script in `supabase-schema-update.sql` to create `verifications` and `activity_logs` tables with Row Level Security policies.

***

### 5. Run the Development Server

```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

***

### 6. Build for Production

```bash
npm run build
npm run preview
```

***

## 🔑 Admin Portal Setup

1. Register a user account on the website or via `supabase.auth.signUp()`.
2. In Supabase Dashboard, go to **Table Editor**, open the `users` table.
3. Update the `role` field for your admin user to `admin` or `super_admin`.
4. Log in via `/admin-login` to access the enterprise Admin Dashboard at `/admin`.

***

## 🎨 Design System and Typography

* **Headings and Display**: Outfit (bold, geometric SaaS typography)
* **Body and Controls**: Plus Jakarta Sans (crisp letter spacing)
* **Primary Background**: Dark Obsidian `#0C1017` / `#111622`
* **Brand Accent**: Amber Gold `#F59E0B`
* **Verified Accent**: Emerald `#10B981` / Teal `#2FE1B8`

***

## 📄 License

This project is licensed under the MIT License.

***

## 📬 Contact and Support

For questions or suggestions, open an issue on the [WayFare_Carpool_App Repository](https://github.com/OwaisTanoli71/WayFare_Carpool_App).
