# Wayfare 🚗

**A real-time carpool platform for safe, verified, gender-matched ride sharing — in-city and intercity.**

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?style=flat-square&logo=framer&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📖 Overview

Wayfare is a full-featured carpool web app built for riders and drivers who want a **safer, verified, community-driven** way to share rides. It supports gender-matched ride preferences, verified user profiles, real-time in-app chat, trusted contacts, SOS safety alerts, and an admin dashboard — all wrapped in a fast, installable Progressive Web App.

---

## ✨ Features

- 🔐 **Authentication** — secure signup/login via Supabase Auth
- 🧑‍🤝‍🧑 **Verified Profiles** — identity verification flow before riders/drivers can transact
- 🚘 **Post & Find Rides** — create ride offers or search available rides by route
- 💬 **In-App Chat** — real-time messaging between riders and drivers
- 🛡️ **Safety First** — SOS button, trusted contacts, and offline/online status indicators
- 🧭 **Route Visualization** — animated route lines and route heatmaps
- 👥 **Ride Circles** — save and ride with trusted, recurring travel groups
- 💰 **Earnings Dashboard** — drivers can track trip earnings and analytics
- 🛠️ **Admin Dashboard** — manage users, verifications, and platform activity
- 📱 **Installable PWA** — works offline, installable on mobile and desktop
- 🎨 **Fully Responsive UI** — optimized for mobile, tablet, laptop, and desktop screens

---

## 🧰 Tech Stack

| Layer            | Technology                                   |
|-------------------|-----------------------------------------------|
| Frontend          | React 18, Vite 5                              |
| Styling           | Tailwind CSS 3                                |
| Animations        | Framer Motion                                 |
| Routing           | React Router DOM 6                            |
| Backend / Auth    | Supabase (Postgres, Auth, Realtime)           |
| Icons             | Lucide React                                  |
| PWA               | vite-plugin-pwa + Workbox                     |

---

## 📁 Project Structure

```
carpool-app/
├── src/
│   ├── components/       # Reusable UI components (Navbar, Sidebar, RideCard, SOSButton, etc.)
│   ├── pages/             # Route-level pages (Dashboard, FindRide, PostRide, Chat, Profile, Admin, etc.)
│   ├── context/           # Global app state (AppContext)
│   ├── hooks/              # Custom React hooks (useTripTracker)
│   ├── lib/                # Supabase client & SOS utilities
│   ├── data/                # Mock data for local development
│   ├── App.jsx              # Route definitions
│   ├── main.jsx              # App entry point
│   └── index.css              # Global styles & Tailwind directives
├── public/                      # Static assets
├── tailwind.config.js            # Design tokens (colors, fonts, animations)
└── vite.config.js                 # Vite + PWA configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/wayfare-carpool-app.git
cd wayfare-carpool-app/carpool-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and add your Supabase project credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

App will be available at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

This project deploys cleanly to **Vercel** or **Netlify** (auto-detects Vite):

1. Connect your GitHub repository
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the project's environment variable settings
3. Deploy 🎉

---

## 🎨 Design System

- **Primary background:** Midnight ink `#0D1026`
- **Accent (primary actions):** Amber beacon `#FFB238`
- **Accent (trust/safety):** Teal verified `#2FE1B8`
- **Fonts:** Bricolage Grotesque (headings), Inter (body), JetBrains Mono (prices/times/codes)

All design tokens are defined in `tailwind.config.js` — update the `beacon`, `verified`, and `ink` values to re-theme the entire app.

---

## 🔑 Admin Setup

To create the first admin account:

1. Open your Supabase Dashboard → **Table Editor** → `users` table
2. Locate the target user's row
3. Set the `role` column to `admin`

Once created, the admin can log in and promote other verified users to admin from the **Admin Dashboard** UI.

---

## 🗺️ Roadmap

- [ ] Live ride tracking with real-time driver location
- [ ] In-app payments
- [ ] Push notifications for ride updates
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

For questions, suggestions, or collaboration — feel free to open an issue on this repository.
