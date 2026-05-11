import { mock } from "bun:test";

mock.module("firebase/app", () => ({
  initializeApp: () => ({})
}));

mock.module("firebase/auth", () => ({
  getAuth: () => ({ currentUser: null }),
  GoogleAuthProvider: class {},
  FacebookAuthProvider: class {},
  OAuthProvider: class { constructor() {} },
  signInWithRedirect: async () => {},
  createUserWithEmailAndPassword: async () => ({ user: {} }),
  signInWithEmailAndPassword: async () => ({ user: {} }),
  sendEmailVerification: async () => {},
  signOut: async () => {}
}));

