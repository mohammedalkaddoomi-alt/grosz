# 📱 How to Get Your Expo Go QR Code

Since the sandbox environment can't display the Expo QR code directly, you'll need to run the app on your local computer. Here's how:

## Method 1: Run Locally (Recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/mohammedalkaddoomi-alt/grosz.git
cd grosz/frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Expo
```bash
npx expo start
```

### Step 4: Scan the QR Code
The terminal will display a **QR code** that looks like this:

```
  ▄▄▄▄▄▄▄  ▄▄▄▄  ▄▄▄▄▄▄▄
  █ ▄▄▄ █ ██▄▀ ▄ █ ▄▄▄ █
  █ ███ █ ▀ ▄▀▀▄ █ ███ █
  █▄▄▄▄▄█ ▄ █ █ █ █▄▄▄▄▄█
  ▄▄▄▄▄ ▄▄▄▄▀▄▀▄▄ ▄ ▄ ▄ 
  ...
```

**On iOS**: Open the Camera app and point it at the QR code
**On Android**: Open the Expo Go app and tap "Scan QR Code"

---

## Method 2: Use Tunnel Mode (For Remote Access)

If your phone is not on the same WiFi network:

```bash
npx expo start --tunnel
```

This creates a public URL you can access from anywhere. The QR code will appear in the terminal.

---

## Method 3: Manual URL Entry

If you can't scan the QR code:

1. Start Expo: `npx expo start`
2. Look for the URL in the terminal output (e.g., `exp://192.168.1.100:8081`)
3. Open Expo Go app on your phone
4. Tap "Enter URL manually"
5. Type the URL shown in your terminal

---

## What You'll See

Once the app loads on your phone, you'll see:

### 🎭 Demo Mode (Default)
The app runs with mock data, no backend needed:
- Pre-loaded with 3 wallets
- 8 sample transactions
- 3 savings goals
- Full functionality works offline

### Login Screen
- Email: `demo@test.pl` (or any email)
- Password: `123456` (or any password)
- Or tap "Rejestracja" to create a new account

All data is stored locally on your phone in demo mode!

---

## Troubleshooting

### QR Code Won't Scan
- Make sure your phone and computer are on the **same WiFi network**
- Try using tunnel mode: `npx expo start --tunnel`
- Manually enter the URL shown in terminal

### "Unable to connect to Metro"
- Check that the Expo server is still running
- Restart with: `npx expo start -c` (clears cache)
- Make sure port 8081 is not blocked by firewall

### "Network response timed out"
- Your phone and computer must be on the same network
- Use tunnel mode for remote access
- Check your firewall settings

### App Shows Errors
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Make sure you're using Node.js v18 or higher

---

## Demo Mode vs Real Backend

### Current Setup (Demo Mode)
✅ No backend needed
✅ Works offline
✅ Pre-loaded data
✅ Perfect for UI testing

### To Use Real Backend
1. Set up MongoDB
2. Start backend: `cd backend && ./start.sh`
3. Update `frontend/.env`:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:8000
   EXPO_PUBLIC_DEMO_MODE=false
   ```
4. Restart Expo: `npx expo start -c`

---

## Quick Commands Reference

```bash
# Start Expo (local network)
npx expo start

# Start with tunnel (remote access)
npx expo start --tunnel

# Clear cache and restart
npx expo start -c

# Install dependencies
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

---

## Need Help?

1. **Check Expo Dev Tools**: Opens automatically in browser at `http://localhost:19002`
2. **View Logs**: All errors appear in terminal and Expo Go app
3. **Restart Everything**: Close Expo, close Expo Go app, start fresh

---

## What to Test

Once the app is running on your phone:

### ✅ Navigation
- Swipe between tabs
- Tap the floating + button
- Open wallet details
- Navigate to profile

### ✅ UI/UX
- Smooth animations
- Beautiful gradients
- Touch-friendly buttons
- Clear visual hierarchy

### ✅ Features
- Create new wallet
- Add transaction
- Set savings goal
- View shared wallet with members
- Check transaction history
- Try AI chat

### ✅ Joint Accounts
- See shared wallet badge (purple)
- View member avatars
- See transactions from different users
- Try inviting a user (demo mode simulates this)

---

**Enjoy testing Cenny Grosz! 💰✨**

If you have any issues, the app is fully functional in demo mode and all features can be tested without a backend!
