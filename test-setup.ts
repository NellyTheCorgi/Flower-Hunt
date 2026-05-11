import { mock } from "bun:test";

mock.module("firebase/app", () => ({
  initializeApp: mock(() => ({})),
}));

const mockBatch = {
  set: mock(() => {}),
  update: mock(() => {}),
  delete: mock(() => {}),
  commit: mock(() => Promise.resolve())
};

mock.module("firebase/firestore", () => ({
  getFirestore: mock(() => ({})),
  collection: mock(() => ({})),
  doc: mock((db, col, id) => ({ id })),
  getDoc: mock(() => Promise.resolve({ exists: () => true, data: () => ({ stats: { xp: 0, totalFound: 0, level: 1 } }) })),
  getDocs: mock(() => Promise.resolve({ empty: true, docs: [] })),
  query: mock(() => ({})),
  where: mock(() => ({})),
  setDoc: mock(() => Promise.resolve()),
  updateDoc: mock(() => Promise.resolve()),
  deleteDoc: mock(() => Promise.resolve()),
  serverTimestamp: mock(() => "timestamp"),
  writeBatch: mock(() => mockBatch),
}));

mock.module("firebase/auth", () => ({
  getAuth: mock(() => ({})),
  GoogleAuthProvider: class {},
  FacebookAuthProvider: class {},
  OAuthProvider: class {},
  signInWithRedirect: mock(() => Promise.resolve()),
  createUserWithEmailAndPassword: mock(() => Promise.resolve()),
  signInWithEmailAndPassword: mock(() => Promise.resolve()),
  sendEmailVerification: mock(() => Promise.resolve()),
  signOut: mock(() => Promise.resolve()),
}));

