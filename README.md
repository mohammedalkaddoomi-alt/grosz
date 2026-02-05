# 💰 Cenny Grosz - Financial Management App

A modern, feature-rich financial management application built with React Native (Expo) and FastAPI. Manage your personal finances, create shared wallets with others, track expenses, set savings goals, and get AI-powered financial advice.

## ✨ Key Features

### 💳 Wallet Management
Create multiple personal wallets with custom names and emojis to organize your finances. Track balance across all wallets with a beautiful visual design featuring gradients and shadows.

### 🤝 Joint Accounts (Shared Wallets)
Create shared wallets for couples, families, or roommates. Invite users by email to join shared wallets where all members can add transactions and view balance. Owners have full control to add/remove members and delete wallets. Visual indicators throughout the app distinguish shared wallets from personal ones.

### 💸 Transaction Tracking
Add income and expenses with predefined or custom categories. Each category supports emoji icons for quick visual identification. View transaction history grouped by date, filter by income or expense type, and see who created each transaction in shared wallets. Add optional notes for transaction details.

### 🎯 Savings Goals
Set financial goals with target amounts and track progress with visual progress bars. Contribute to goals over time and celebrate when you reach your targets.

### 🤖 AI Financial Assistant
Chat with "Cenny Grosz," an AI assistant that provides personalized financial advice, analyzes spending patterns, and helps with budget planning. The assistant has context-aware responses based on your actual financial data.

### 📊 Dashboard & Analytics
View your total balance across all wallets, monthly income and expenses, category breakdown, goals progress overview, and recent transactions all in one place.

## 🚀 Quick Start

### Prerequisites

You'll need Node.js (v18+), Python (v3.11+), MongoDB (v4.4+), and Expo CLI installed on your system.

### Backend Setup

Navigate to the backend directory and install Python dependencies with `pip3 install -r requirements.txt`. Copy `.env.example` to `.env` and configure your MongoDB connection string, JWT secret, and optional AI API key. Start MongoDB using your system's service manager or by running mongod directly. Finally, start the backend server with `./start.sh` or `uvicorn server:app --reload --host 0.0.0.0 --port 8000`. The API will be available at http://localhost:8000.

### Frontend Setup

Navigate to the frontend directory and run `npm install` to install dependencies. Create a `.env` file with `EXPO_PUBLIC_BACKEND_URL=http://localhost:8000` (or use your computer's IP address if testing on a physical device). Start the Expo development server with `npx expo start`, then press 'i' for iOS simulator, 'a' for Android emulator, or scan the QR code with Expo Go on your phone.

## 📱 Tech Stack

The frontend is built with React Native using Expo, TypeScript for type safety, Expo Router for navigation, and Zustand for state management. The backend uses FastAPI for high-performance API, MongoDB with Motor async driver, Pydantic for data validation, JWT for authentication, and bcrypt for secure password hashing.

## 🔐 API Overview

The API provides comprehensive endpoints for authentication (register, login, get current user), wallet management (CRUD operations), joint account features (invite users, manage members, leave wallets), transaction tracking, savings goals, custom categories, AI chat assistant, dashboard statistics, and user search for invitations.

## 🎨 Design System

The app features a modern design system with a professional color palette including Indigo primary, Green for income, Red for expenses, and Purple for shared wallets. Beautiful gradients provide visual appeal, while a three-level shadow system creates depth. Consistent spacing (4px to 32px) and border radius (8px to 24px) ensure a polished look throughout.

## 🤝 Joint Account Workflow

The joint account feature allows seamless collaboration on finances. A user creates a shared wallet and invites others by email. Once invited, all members can add transactions and view the shared balance. The wallet owner can manage members and delete the wallet, while members can leave at any time. All activity is tracked with user attribution.

## 🐛 Troubleshooting

If the backend won't start, check that MongoDB is running and the `.env` file is properly configured. If the frontend can't connect, verify the `EXPO_PUBLIC_BACKEND_URL` matches your backend location (use your computer's IP for physical devices, not localhost). For TypeScript errors, run `npx tsc --noEmit` and clear the Expo cache with `npx expo start -c`.

## 📝 Environment Variables

The backend requires `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, and optionally `EMERGENT_LLM_KEY` in its `.env` file. The frontend needs `EXPO_PUBLIC_BACKEND_URL` pointing to your backend server.

## 🚧 Future Enhancements

Planned features include push notifications for shared wallet activity, transaction approval workflows, spending limits per member, export to CSV/PDF, budget tracking with alerts, recurring transactions, multi-currency support, biometric authentication, dark mode toggle, and transaction attachments for receipts.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

For detailed information about all improvements and features, see [IMPROVEMENTS.md](./IMPROVEMENTS.md).

**Happy budgeting! 💰✨**
