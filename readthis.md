# 📱 Fine News App - Reviewer Guide

Welcome! This guide will help you run the **Fine News App** locally for review purposes without needing access to the production database.

We have prepared a **Demo Mode** that runs a local database emulator and seeds it with test data.

## 🛠 Prerequisites

Before you begin, please ensure you have the following installed:

1.  **Node.js** (v18 or later recommended)
2.  **Java** (Required for Firebase Emulators)
3.  **Xcode & iOS Simulator** (Mac only)
4.  **CocoaPods** (`sudo gem install cocoapods`)

## 🚀 Quick Start (Demo Mode)

You can start the entire environment (Database + App) with a single command.

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Install Firebase Tools (Global)**
    ```bash
    npm install -g firebase-tools
    ```

3.  **Run Demo Mode**
    ```bash
    npm run demo:start
    ```

### What happens next?
1.  **Firebase Emulator** starts locally (Ports: 8080, 9099, 5001, 9199).
2.  **Test Data** is automatically inserted (News, Community Posts, etc.).
3.  **iOS Simulator** launches.
4.  **Auto-Login**: The login screen will be pre-filled with the demo account:
    *   **Email:** `demo@fine.com`
    *   **Password:** `test1234`
5.  Simply tap **"이메일로 로그인" (Login with Email)** to enter the app.

## 🧪 Features to Test

In Demo Mode, you can freely test the following features:
*   **News Tab:** View AI-summarized news articles (Pre-loaded).
*   **Community:** Write posts, leave comments (Data is saved to local memory).
*   **Calendar:** View economic schedules and personal events.
*   **My Page:** Check the verified student profile.

## ❓ Troubleshooting

**"Port already in use" error?**
The `demo:start` command automatically attempts to free up ports (8080, 9099, 5001, 9199) before starting.
If you still encounter issues, try running the command again.
```bash
npm run demo:start
```

---
*Thank you for reviewing Fine News App!*
