# VeraFlow - Healthcare Compliance Mobile App

A mobile application that helps remote healthcare teams improve compliance through guided workflows, smart recommendations, and seamless integrations.

## Features

- **Compliance Dashboard** - Track your team's compliance readiness score
- **Guided Workflows** - Step-by-step compliance processes
- **Smart Recommendations** - AI-powered compliance insights
- **Team Collaboration** - Assign tasks and track progress
- **Integrations** - Connect with EHR systems and productivity tools
- **Reports** - Compliance summaries and audit readiness

## Tech Stack

- **Frontend**: React Native with Expo SDK 52
- **Routing**: Expo Router (file-based routing)
- **Backend**: Convex (real-time database)
- **Auth**: Convex Auth (email/password)
- **State**: Zustand
- **UI**: Custom components with minimalist design

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Convex account

### Installation

1. Clone the repository:
```bash
cd veraflow
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Add your Convex URL to `.env`:
```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

6. Start the development server:
```bash
npm start
```

## Project Structure

```
veraflow/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/      # Onboarding flow
│   └── (tabs)/            # Main app tabs
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── convex/                # Backend functions & schema
├── lib/                   # Utilities & stores
└── assets/               # Images & fonts
```

## Screens

### Authentication
- Welcome
- Sign Up
- Login
- Forgot Password

### Onboarding
- Workspace Setup
- Organization Details
- Team Type Selection
- Goals Selection
- Assessment
- Results
- Readiness Score

### Main App
- Home
- Dashboard
- Workflows (list, detail, create)
- Recommendations (list, detail, history)
- Settings
  - Integrations
  - Team Members
  - Reports
  - Billing
  - Account
  - Notifications
  - Help

## Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| Starter | $29/mo | 5 members, 3 workflows, Basic integrations |
| Professional | $149/mo | 25 members, Unlimited workflows, All integrations |
| Enterprise | $499/mo | Unlimited everything, SSO, API access |

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved
