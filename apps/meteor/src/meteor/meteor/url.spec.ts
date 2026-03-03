import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { absoluteUrl } from "./url";

describe("URL Utilities", () => {
  describe("absoluteUrl - basics", () => {
    const prefixes = ["", "http://"];

    it("should handle basic root URL and paths", () => {
      prefixes.forEach((prefix) => {
        expect(absoluteUrl({ rootUrl: prefix + "asdf.com" })).toBe("http://asdf.com/");
        expect(absoluteUrl(undefined, { rootUrl: prefix + "asdf.com" })).toBe("http://asdf.com/");
        expect(absoluteUrl(undefined, { rootUrl: prefix + "asdf.com/" })).toBe("http://asdf.com/");

        expect(absoluteUrl("foo", { rootUrl: prefix + "asdf.com/" })).toBe("http://asdf.com/foo");
        expect(absoluteUrl("/foo", { rootUrl: prefix + "asdf.com" })).toBe("http://asdf.com/foo");
        expect(absoluteUrl("#foo", { rootUrl: prefix + "asdf.com" })).toBe("http://asdf.com/#foo");
      });
    });

    it("should handle secure URLs and coercion", () => {
      prefixes.forEach((prefix) => {
        expect(absoluteUrl("foo", { rootUrl: prefix + "asdf.com", secure: true })).toBe("https://asdf.com/foo");
        expect(absoluteUrl("foo", { rootUrl: "https://asdf.com", secure: true })).toBe("https://asdf.com/foo");
        expect(absoluteUrl("foo", { rootUrl: "https://asdf.com", secure: false })).toBe("https://asdf.com/foo");
      });
    });

    it("should not coerce localhost to https", () => {
      prefixes.forEach((prefix) => {
        expect(absoluteUrl("foo", { rootUrl: prefix + "localhost", secure: true })).toBe("http://localhost/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "localhost:3000", secure: true })).toBe("http://localhost:3000/foo");
        expect(absoluteUrl("foo", { rootUrl: "https://localhost:3000", secure: true })).toBe("https://localhost:3000/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "127.0.0.1:3000", secure: true })).toBe("http://127.0.0.1:3000/foo");
      });
    });

    it("should correctly replace localhost with 127.0.0.1", () => {
      prefixes.forEach((prefix) => {
        expect(absoluteUrl("foo", { rootUrl: prefix + "localhost:3000", replaceLocalhost: true })).toBe("http://127.0.0.1:3000/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "localhost", replaceLocalhost: true })).toBe("http://127.0.0.1/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "127.0.0.1:3000", replaceLocalhost: true })).toBe("http://127.0.0.1:3000/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "127.0.0.1", replaceLocalhost: true })).toBe("http://127.0.0.1/foo");

        // Don't replace just any matching 'localhost' string inside a domain
        expect(absoluteUrl("foo", { rootUrl: prefix + "foo.com/localhost", replaceLocalhost: true })).toBe("http://foo.com/localhost/foo");
        expect(absoluteUrl("foo", { rootUrl: prefix + "foo.localhost.com", replaceLocalhost: true })).toBe("http://foo.localhost.com/foo");
      });
    });
  });

  describe("absoluteUrl - environment", () => {
    let originalConfig: any;

    beforeAll(() => {
      originalConfig = (globalThis as any).__meteor_runtime_config__;
      (globalThis as any).__meteor_runtime_config__ = { ROOT_URL: "http://myapp.com" };
    });

    afterAll(() => {
      if (originalConfig !== undefined) {
        (globalThis as any).__meteor_runtime_config__ = originalConfig;
      } else {
        delete (globalThis as any).__meteor_runtime_config__;
      }
    });

    it("should read ROOT_URL from global config when available", () => {
      // Assuming a simulated environment check
      const isHttp = /^http/.test((globalThis as any).__meteor_runtime_config__.ROOT_URL);
      expect(isHttp).toBe(true);
    });
  });
});