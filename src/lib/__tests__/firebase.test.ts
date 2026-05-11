import { describe, test, expect, mock } from "bun:test";
import { loginWithEmail } from "../firebase";
import * as auth from "firebase/auth";

describe("firebase auth error paths", () => {
  const originalConsoleError = console.error;

  test("loginWithEmail should log and throw error when signInWithEmailAndPassword fails", async () => {
    console.error = mock();

    // Override the mock specifically for this test
    const mockSignIn = auth.signInWithEmailAndPassword as any;
    mockSignIn.mockRejectedValueOnce(new Error("Firebase Auth Error"));

    try {
      await loginWithEmail("test@example.com", "password123");
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toBe("Firebase Auth Error");
      expect(console.error).toHaveBeenCalledWith('Email login error:', error);
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalled();
    } finally {
      console.error = originalConsoleError;
      mockSignIn.mockClear();
    }
  });
});
