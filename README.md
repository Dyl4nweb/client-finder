# Client Finder

A modern, fast, and functional **Client Finder** web application built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Supabase**, and the **Google Places API**.

Designed specifically for freelancers, web design agencies, and digital consultants to discover local businesses, pinpoint high-value prospects without a modern web presence, and track client outreach from first contact to won deals.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Minimalist light SaaS theme)
- **Database:** [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS)
- **Authentication:** [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Discovery Engine:** [Google Places API](https://developers.google.com/maps/documentation/places/web-service) (Live business search)
- **Email Delivery:** [Resend API](https://resend.com/) (Direct cold outreach delivery)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Key Features

### 1. Outreach Dashboard
- **Total Saved Leads:** High-level overview of your prospect pipeline.
- **New Leads:** Prospects that haven't been reached out to yet.
- **Contacted Leads:** Active discussions and follow-ups.
- **No Website Listed (High Opportunity):** Instantly highlights businesses lacking a web presence—prime candidates for new website builds!
- **Quick Discovery Presets:** 1-click jumps to search for Cafés, Salons, Clinics, Local Shops, and more.
- **Recent Leads Table:** Inline status updates, notes preview, direct telephone links, and Google Maps links.

### 2. Find Clients (Google Places API Integration)
- Search real businesses using:
  - **Category:** Cafés, Restaurants, Salons, Clinics, Local Shops, Dentists, Plumbers, and more.
  - **Location:** Any city or area (e.g., `Austin, TX`, `Miami, FL`, `London`).
  - **Business Name:** Optional keyword/brand filter.
- Real business metadata displayed:
  - Business name, categories, ratings & review count.
  - Complete formatted street address.
  - Clickable phone numbers (`tel:`) for immediate outreach.
  - Website link or a prominent **"No Website Listed"** opportunity badge.
  - Direct Google Maps profile link.
- **Save Lead Button:** 1-click lead saving with duplicate prevention (`external_place_id` check).
- **Graceful API Key Handling:** If `GOOGLE_PLACES_API_KEY` is not yet configured, the app displays a clear setup guide rather than failing silently, along with a 1-click "Explore Sample Data" sandbox mode.

### 3. Saved Leads & Outreach Tracking
- Comprehensive table and card views of all saved prospects.
- **Full-Text Filter & Search:** Filter by status (`All`, `New`, `Contacted`, `Interested`, `Won`, `Lost`) and search by business name, city, address, or custom notes.
- **High-Priority Filter:** Toggle "Only show businesses without a website" to focus on the highest-probability web design prospects.
- **Inline Status Dropdown:** Easily change lead status from `New` to `Contacted`, `Interested`, `Won`, or `Lost`.
- **Client Notes & Activity Log:** Edit conversation notes, owner names, quote amounts, and follow-up schedules.
- **Lead Deletion:** Includes confirmation dialog to prevent accidental removal.

### 4. Supabase PostgreSQL & Row Level Security (RLS)
- Persistent cloud database storage in Supabase PostgreSQL.
- Each user's leads are securely isolated with Row Level Security policies (`auth.uid() = user_id`).
- Automatic fallback to browser storage with pre-seeded demo data if Supabase credentials are not yet configured.

### 5. Varex AI Assistant (Gemini-Powered)
- **Dedicated Strategy Page (`/assistant`):** AI consultant specialized in turning local prospects into paying clients.
- **Preset Action Chips:** 1-click cold email drafts, 3-sentence SMS pitches, objection handling (*"Facebook is enough"*), pricing guides, and niche profitability analysis.
- **Global Floating Drawer:** Access Varex AI from any page without losing your work.
- **1-Click AI Pitch Buttons:** Instantly invoke Varex AI pre-loaded with any discovered or saved business.

### 6. Resend Email Dispatch Integration
- **Direct Email Sending (`/api/email/send`):** Dispatch outreach emails directly from the app using your Resend API key.
- **Interactive Email Modal (`SendEmailModal`):** Review recipient address, subject, and body before sending.
- **Automated CRM Sync:** Automatically marks the lead as `Contacted` and appends a timestamped outreach log to the lead's notes upon successful transmission.

### 7. Private PIN Code Gate & Security
- **App Lock:** Access is secured behind a private PIN gate screen before the app can be opened.
- **Default PIN:** `2003` (or customizable).
- **Custom PIN:** Set your own PIN in `.env.local` using `NEXT_PUBLIC_APP_PIN=your_pin` or update it anytime using **"Change PIN Code"** in the sidebar.
- **Manual Lock:** Quick **"Lock Application"** button in the sidebar to secure the screen when stepping away from your device.

---

## Getting Started

### 1. Installation

```bash
# Clone or enter the project directory
cd "Clients finder"

# Install dependencies
npm install
```

### 2. Environment Variables Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Google Cloud Places API Configuration
GOOGLE_PLACES_API_KEY=AIzaSy...

# Google Gemini AI Configuration (for Varex AI)
GEMINI_API_KEY=your_gemini_api_key_here

# Resend Email Delivery API Key
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=ClientFinder Outreach <onboarding@resend.dev>
```

---

## Supabase Database Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to your **Supabase Dashboard > SQL Editor > New Query**.
3. Open and copy the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Run the query. It will:
   - Create the `leads` table with all fields (`id`, `user_id`, `business_name`, `category`, `address`, `phone`, `website_url`, `google_maps_url`, `external_place_id`, `status`, `notes`, `created_at`, `updated_at`).
   - Enable **Row Level Security (RLS)**.
   - Configure policies allowing authenticated users to select, insert, update, and delete only their own leads.
   - Add indexes for fast sorting and duplicate prevention.
5. In **Project Settings > API**, copy your **Project URL** and **Anon Public API Key** into `.env.local`.

---

## Google Places API Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
2. Enable the **Places API (New)** (or legacy **Places API**).
3. Create an API Key in **Credentials**.
4. Set `GOOGLE_PLACES_API_KEY` in `.env.local`.
5. *(Recommended)* Restrict your API key in Google Cloud Console to only the Places API and your deployment domains to avoid unauthorized usage.

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Dashboard:** [http://localhost:3000/](http://localhost:3000/)
- **Find Clients:** [http://localhost:3000/search](http://localhost:3000/search)
- **Saved Leads:** [http://localhost:3000/leads](http://localhost:3000/leads)

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── chat/route.ts    # Gemini & Varex AI consultant route
│   │   │   ├── email/
│   │   │   │   └── send/route.ts    # Resend email delivery route
│   │   │   └── places/
│   │   │       └── search/route.ts  # Google Places API server proxy
│   │   ├── assistant/
│   │   │   └── page.tsx             # Varex AI Assistant strategy page
│   │   ├── leads/
│   │   │   └── page.tsx             # Saved Leads & outreach tracking
│   │   ├── search/
│   │   │   └── page.tsx             # Business discovery search page
│   │   ├── globals.css              # Light theme design tokens & styles
│   │   ├── layout.tsx               # Root layout & providers
│   │   └── page.tsx                 # Outreach dashboard
│   ├── components/
│   │   ├── assistant/
│   │   │   └── FloatingAssistant.tsx # Global slide-out AI assistant widget
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx        # Supabase owner account modal
│   │   │   ├── ChangePinModal.tsx   # Custom PIN code modal
│   │   │   └── PinGate.tsx          # Private PIN security gate
│   │   ├── email/
│   │   │   └── SendEmailModal.tsx   # Resend outreach email sending modal
│   │   ├── layout/
│   │   │   └── Sidebar.tsx          # Responsive navigation sidebar
│   │   ├── leads/
│   │   │   ├── NotesModal.tsx       # Notes & tracking modal
│   │   │   ├── StatusBadge.tsx      # Semantic status badges
│   │   │   └── StatusDropdown.tsx   # Inline status selector
│   │   └── setup/
│   │       └── SetupBanner.tsx      # Config status indicator & setup guide
│   ├── context/
│   │   ├── AuthContext.tsx          # Supabase auth session provider
│   │   └── LeadsContext.tsx         # Unified reactive leads state
│   ├── lib/
│   │   ├── leads-service.ts         # Unified storage & Supabase CRUD layer
│   │   └── supabase/
│   │       ├── client.ts            # Supabase browser client
│   │       └── server.ts            # Supabase server client
│   └── types/
│       └── index.ts                 # TypeScript interfaces
├── supabase/
│   └── schema.sql                   # Supabase PostgreSQL schema & RLS policies
├── .env.example                     # Environment template
└── package.json
```

---

## License

MIT
