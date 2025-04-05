# Referral Hub

A platform for managing and accessing promotions and referral codes across different industries.

## Features

- User authentication with email/password
- Age verification (18+ and 21+ content)
- Industry-based categories
- Promotion tracking
- Referral code system with unlockable content
- Rating system
- Multiple pricing tiers:
  - $1 promotions
  - $5 referral package
  - $25 section package
  - $100 complete access
- Payment integration (Venmo/Apple Pay)

## Setup Requirements

1. Install Node.js from: https://nodejs.org/
2. Install project dependencies:
```bash
npm install
```

## Development Setup

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run the development server:
```bash
npm run dev
```

## Project Structure

```
referral-hub/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── promotions/
│   │   ├── referrals/
│   │   └── common/
│   ├── pages/
│   ├── services/
│   └── utils/
├── public/
└── package.json
```
