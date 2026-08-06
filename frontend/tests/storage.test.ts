// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAllAuthStorage,
  getAdminLoginIdentifier,
  getAdminSessionToken,
  getClientLoginIdentifier,
  getClientSessionToken,
  setAdminSession,
  setClientSession,
} from "../src/lib/storage";

describe("authentication session storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and clears client and administrator sessions", () => {
    setClientSession("client-token", "client@example.com");
    setAdminSession("admin-token", "admin");

    expect(getClientSessionToken()).toBe("client-token");
    expect(getClientLoginIdentifier()).toBe("client@example.com");
    expect(getAdminSessionToken()).toBe("admin-token");
    expect(getAdminLoginIdentifier()).toBe("admin");

    clearAllAuthStorage();

    expect(getClientSessionToken()).toBeNull();
    expect(getClientLoginIdentifier()).toBeNull();
    expect(getAdminSessionToken()).toBeNull();
    expect(getAdminLoginIdentifier()).toBeNull();
  });
});
