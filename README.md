# Flower Hunt - Production Readiness Review Documentation

This repository has been audited and refactored for production readiness.

## Architecture Overview

Flower Hunt is a React-based web application (Vite, TypeScript, Tailwind CSS) that uses:
- **Firebase Authentication**: For Google Login.
- **Cloud Firestore**: To store user profiles and flower collections.
- **Google Gemini AI**: To identify flowers from images and generate descriptive text.
- **Wikipedia API**: To fetch additional botanical information.
- **Google Maps Platform**: To visualize collection locations.

## Security Features

- **Environment Variables**: Sensitive keys (`VITE_GEMINI_API_KEY`, `VITE_GOOGLE_MAPS_PLATFORM_KEY`) are managed via Vite environment variables and are no longer hardcoded or explicitly bundled in `vite.config.ts`.
- **XSS Protection**: All user-generated and AI-generated content rendered via `react-markdown` uses the `skipHtml` property to prevent malicious script injection.
- **Firestore Rules**: Strict security rules enforce that users can only read and write their own data using `auth.uid` validation.
- **Data Sanitization**: Image uploads are resized and compressed client-side before being sent to AI services.

## Setup & Deployment

### Prerequisites
- Node.js 20+
- A Firebase Project
- Google Gemini API Key
- Google Maps JavaScript API Key

### Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_key
   ```
4. Configure Firebase:
   - Copy your Firebase config to `firebase-applet-config.json`.
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`.
5. Run the development server:
   ```bash
   npm run dev
   ```

### Docker Deployment
The application includes a multi-stage `Dockerfile` for lean production deployment.
```bash
docker build -t flower-hunt .
docker run -p 3000:3000 flower-hunt
```

## Refactoring & Scale

- **Type Safety**: Introduced a centralized types system in `src/types/index.ts` to eliminate `any` usage.
- **Logic Separation**: Flower identification and collection logic has been moved to a custom hook `useFlowerScanner` for better maintainability and testability.
- **Error Handling**: Replaced generic `alert()` calls with a non-blocking `ErrorToast` component.
- **Dependency Optimization**: Removed redundant AI libraries and optimized build artifacts.
