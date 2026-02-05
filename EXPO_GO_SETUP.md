# 📱 Running Cenny Grosz on Expo Go

## Demo Mode Setup (No Backend Required)

The app is configured to run in **DEMO MODE** which uses mock data, so you can review the UI and features without setting up a backend server.

### Steps to Run on Your Phone

1. **Install Expo Go** on your phone:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Clone the repository** on your computer:
   ```bash
   git clone https://github.com/mohammedalkaddoomi-alt/grosz.git
   cd grosz/frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Verify demo mode is enabled** - Check that `frontend/.env` contains:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://demo-mode
   EXPO_PUBLIC_DEMO_MODE=true
   ```

5. **Start Expo development server**:
   ```bash
   npx expo start
   ```

6. **Scan the QR code**:
   - iOS: Open Camera app and scan the QR code
   - Android: Open Expo Go app and scan the QR code

7. **Login with any credentials** (demo mode accepts anything):
   - Email: demo@test.pl
   - Password: 123456
   - Or register a new account (all data is stored locally)

### What You Can Test in Demo Mode

✅ **All UI Screens**:
- Beautiful dashboard with balance and quick actions
- Wallet management screen (personal and shared wallets)
- Add transaction with category selection
- Transaction history with filtering
- Goals tracking with progress bars
- AI chat interface
- Profile screen

✅ **Joint Account Features**:
- View shared wallets with member avatars
- See transactions from different users
- Invite users to shared wallets (simulated)
- Remove members or leave wallets

✅ **Full Functionality**:
- Create new wallets (personal or shared)
- Add income/expense transactions
- Create custom categories with emojis
- Set and contribute to savings goals
- All data persists in local storage

### Demo Data Included

The app comes pre-loaded with:
- 3 wallets (2 personal, 1 shared)
- 8 sample transactions
- 3 savings goals (2 active, 1 completed)
- Multiple categories
- Realistic Polish financial data

### Troubleshooting

**QR Code Won't Scan**:
- Make sure your phone and computer are on the same WiFi network
- Try using tunnel mode: `npx expo start --tunnel`
- Manually enter the URL shown in terminal into Expo Go

**App Won't Load**:
- Clear Expo cache: `npx expo start -c`
- Restart the development server
- Check that `.env` file exists with demo mode enabled

**TypeScript Errors**:
- Run `npx tsc --noEmit` to check for errors
- All errors should be fixed in the latest version

### Switching to Real Backend

When you're ready to use the real backend:

1. **Set up MongoDB** on your system

2. **Start the backend server**:
   ```bash
   cd backend
   ./start.sh
   ```

3. **Update frontend `.env`**:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://YOUR_COMPUTER_IP:8000
   EXPO_PUBLIC_DEMO_MODE=false
   ```

4. **Restart Expo**:
   ```bash
   npx expo start -c
   ```

### Features to Review

When testing on your phone, pay attention to:

1. **UI/UX**:
   - Smooth animations and transitions
   - Beautiful gradients and shadows
   - Consistent spacing and typography
   - Touch-friendly button sizes
   - Clear visual hierarchy

2. **Navigation**:
   - Tab bar navigation
   - Modal screens
   - Back navigation
   - Floating add button

3. **Joint Accounts**:
   - Shared wallet indicators (purple badges)
   - Member avatars
   - User attribution on transactions
   - Invite/remove member flows

4. **Functionality**:
   - Form validation
   - Loading states
   - Success/error messages
   - Pull-to-refresh
   - Long-press actions

### Need Help?

If you encounter any issues:
1. Check the Expo Dev Tools in your browser
2. View console logs for errors
3. Try clearing cache and restarting
4. Ensure you're using Node.js v18+ and latest Expo

---

**Enjoy testing Cenny Grosz! 💰✨**
