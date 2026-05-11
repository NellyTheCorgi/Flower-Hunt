import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

mock.module("firebase/app", () => ({
  initializeApp: () => ({}),
}));

mock.module("firebase/auth", () => ({
  getAuth: () => ({ currentUser: null }),
  GoogleAuthProvider: class {},
  FacebookAuthProvider: class {},
  OAuthProvider: class {},
  signInWithRedirect: async () => {},
  createUserWithEmailAndPassword: async () => ({ user: {} }),
  signInWithEmailAndPassword: async () => ({ user: {} }),
  sendEmailVerification: async () => {},
  signOut: async () => {},
}));

mock.module("firebase/firestore", () => ({
  getFirestore: () => ({}),
  collection: mock(),
  doc: mock(),
  getDoc: mock(),
  getDocs: mock(),
  query: mock(),
  where: mock(),
  setDoc: mock(),
  updateDoc: mock(),
  deleteDoc: mock(),
  serverTimestamp: mock(() => "mock-timestamp"),
}));
