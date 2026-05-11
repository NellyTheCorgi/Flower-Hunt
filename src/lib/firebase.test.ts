import { describe, test, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { OperationType, auth } from './firebase';
import { handleFirestoreError } from './firebase-errors';

describe('handleFirestoreError', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // @ts-ignore
    auth.currentUser = null;
  });

  test('formats string error correctly without user', () => {
    const errorString = "Some string error";

    let caughtError;
    try {
      handleFirestoreError(errorString, OperationType.GET, 'users/123');
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(Error);
    const parsed = JSON.parse((caughtError as Error).message);

    expect(parsed.error).toBe(errorString);
    expect(parsed.operationType).toBe(OperationType.GET);
    expect(parsed.path).toBe('users/123');
    expect(parsed.authInfo.providerInfo).toEqual([]);
    expect(parsed.authInfo.userId).toBeUndefined();
  });

  test('formats Error object correctly with user', () => {
    // @ts-ignore
    auth.currentUser = {
      uid: 'user-123',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant-456',
      providerData: [
        { providerId: 'google.com' },
        { providerId: 'github.com' }
      ]
    };

    const errorObj = new Error("Real error object");

    let caughtError;
    try {
      handleFirestoreError(errorObj, OperationType.WRITE, 'posts/456');
    } catch (e) {
      caughtError = e;
    }

    const parsed = JSON.parse((caughtError as Error).message);

    expect(parsed.error).toBe("Real error object");
    expect(parsed.operationType).toBe(OperationType.WRITE);
    expect(parsed.path).toBe('posts/456');
    expect(parsed.authInfo.userId).toBe('user-123');
    expect(parsed.authInfo.emailVerified).toBe(true);
    expect(parsed.authInfo.isAnonymous).toBe(false);
    expect(parsed.authInfo.tenantId).toBe('tenant-456');
    expect(parsed.authInfo.providerInfo).toEqual([
      { providerId: 'google.com' },
      { providerId: 'github.com' }
    ]);

    // Also verify console.error was called correctly
    expect(consoleErrorSpy).toHaveBeenCalledWith('Firestore Error: ', (caughtError as Error).message);
  });

  test('handles null path correctly', () => {
    let caughtError;
    try {
      handleFirestoreError(new Error("Global error"), OperationType.LIST, null);
    } catch (e) {
      caughtError = e;
    }

    const parsed = JSON.parse((caughtError as Error).message);
    expect(parsed.path).toBeNull();
    expect(parsed.operationType).toBe(OperationType.LIST);
  });
});
