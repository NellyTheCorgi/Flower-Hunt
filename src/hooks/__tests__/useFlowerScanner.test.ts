import { expect, test, mock, describe, beforeEach, spyOn } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useFlowerScanner } from "../useFlowerScanner";
import * as geminiService from "../../services/geminiService";
import * as wikipediaService from "../../services/wikipediaService";

// Mock Firebase module to avoid init issues
mock.module("../../lib/firebase", () => ({
  db: {},
  auth: { currentUser: null },
  handleFirestoreError: () => {},
  OperationType: { WRITE: "write" }
}));

// Mock Firebase Firestore functions
mock.module("firebase/firestore", () => ({
  collection: mock(),
  doc: mock(),
  getDoc: mock(),
  getDocs: mock(),
  query: mock(),
  where: mock(),
  setDoc: mock(),
  updateDoc: mock(),
  deleteDoc: mock(),
  serverTimestamp: mock(() => "mock-timestamp")
}));

describe("useFlowerScanner", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("handles error when AI returns null", async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    spyOn(geminiService, 'identifyFlower').mockResolvedValue(null);

    const { result } = renderHook(() => useFlowerScanner());

    await act(async () => {
      const res = await result.current.scanImage("fake-base64");
      expect(res).toBeNull();
    });

    expect(result.current.error).toBe("Det oppsto en feil under bildeanalysen. Vennligst prøv igjen.");
    expect(result.current.isScanning).toBe(false);

    consoleSpy.mockRestore();
  });

  test("handles error when AI returns error field", async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    spyOn(geminiService, 'identifyFlower').mockResolvedValue({ error: "AI error message" });

    const { result } = renderHook(() => useFlowerScanner());

    await act(async () => {
      const res = await result.current.scanImage("fake-base64");
      expect(res).toBeNull();
    });

    expect(result.current.error).toBe("Beklager, vi klarte ikke å analysere bildet: AI error message");
    expect(result.current.isScanning).toBe(false);

    consoleSpy.mockRestore();
  });

  test("handles successful identification", async () => {
    spyOn(geminiService, 'identifyFlower').mockResolvedValue({
      id: "test-id",
      name: "Test Flower",
      scientificName: "Testus flowerus",
      family: "Testaceae",
      description: "A test flower",
      habitat: "Test env",
      rarity: "common",
      isMatch: true,
      formattedText: "Formatted test"
    });

    spyOn(wikipediaService, 'fetchFlowerInfo').mockResolvedValue({ extract: "Wiki info", sourceUrl: "http://wiki" });

    const { result } = renderHook(() => useFlowerScanner());

    await act(async () => {
      const res = await result.current.scanImage("fake-base64");
      expect(res).not.toBeNull();
      expect(res?.species.name).toBe("Test Flower");
      expect(res?.wikiInfo.extract).toBe("Wiki info");
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isScanning).toBe(false);
  });
});
