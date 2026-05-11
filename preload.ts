import { mock } from "bun:test";

mock.module("firebase/app", () => ({
  initializeApp: () => ({ name: "[DEFAULT]" })
}));

mock.module("firebase/auth", () => {
  return {
    getAuth: () => ({ currentUser: null }),
    GoogleAuthProvider: class {},
    FacebookAuthProvider: class {},
    OAuthProvider: class { constructor() {} },
    signInWithRedirect: () => Promise.resolve(),
    createUserWithEmailAndPassword: () => Promise.resolve({ user: {} }),
    // Default to success
    signInWithEmailAndPassword: mock(() => Promise.resolve({ user: {} })),
    sendEmailVerification: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  };
});

mock.module("firebase/firestore", () => ({
  getFirestore: () => ({})
}));

// Provide env variables
(globalThis as any).import = {
  meta: {
    env: {
      VITE_FIREBASE_API_KEY: "test",
      VITE_FIREBASE_AUTH_DOMAIN: "test",
      VITE_FIREBASE_PROJECT_ID: "test",
      VITE_FIREBASE_STORAGE_BUCKET: "test",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "test",
      VITE_FIREBASE_APP_ID: "test",
    }
  }
};
