/**
 * Determines if a given string represents a relative URL.
 *
 * A relative URL is one that does not contain an absolute URI scheme (e.g., http:, https:, data:, javascript:).
 * This function is used for security validation to prevent protocol-based attacks like XSS via data: URIs
 * or javascript: URIs.
 *
 * Examples of relative URLs:
 * - 'test' → true (simple filename)
 * - '.' → true (current directory)
 * - '..' → true (parent directory)
 * - './test' → true (relative to current directory)
 * - '../test' → true (relative to parent directory)
 * - '/path/to/file' → true (root-relative path)
 * - 'folder/file' → true (relative path)
 *
 * Examples of absolute URLs (NOT relative):
 * - 'https://example.com' → false (HTTP scheme)
 * - 'data:image/gif;base64,...' → false (data URI scheme)
 * - 'javascript:alert(1)' → false (javascript URI scheme)
 * - 'file:///path' → false (file scheme)
 * - 'mailto:user@example.com' → false (mailto scheme)
 *
 * @param str - The URL string to test
 * @returns true if the URL is relative (no scheme), false if it's absolute (has a scheme)
 */
export const isRelativeURL = (str: string): boolean => {
	// Special case: Windows drive letters (C:\, D:\, etc.) are relative paths, not URI schemes
	// Match: single letter + colon + backslash or forward slash
	if (/^[a-zA-Z]:[/\\]/.test(str)) {
		return true;
	}

	// Check for URI scheme pattern: [scheme]:[hierarchical-part]
	// A scheme consists of: a letter followed by any combination of letters, digits, plus, period, or hyphen
	// Reference: RFC 3986 Section 3.1 (https://datatracker.ietf.org/doc/html/rfc3986#section-3.1)
	const schemeMatch = str.match(/^([a-zA-Z][a-zA-Z\d+\-.]*):(.*)$/);

	if (!schemeMatch) {
		// No scheme pattern found, it's relative
		return true;
	}

	const [, scheme, afterColon] = schemeMatch;

	// Security-critical schemes (XSS/injection vectors) are ALWAYS absolute regardless of format
	const dangerousSchemes = /^(javascript|data|vbscript|about)$/i;
	if (dangerousSchemes.test(scheme)) {
		return false; // Absolute (block these for security)
	}

	// Proper URIs have hierarchical structure: scheme://... or scheme:/...
	// If it has slashes after the colon, it's a proper URI (absolute)
	if (afterColon.startsWith('//') || afterColon.startsWith('/')) {
		return false; // Absolute URI (has hierarchical structure)
	}

	// Edge case: single-letter schemes (e.g., "a:", "x:") followed by anything other than path separators
	// These are technically valid URI schemes per RFC 3986, so treat as absolute
	if (scheme.length === 1) {
		return false; // Absolute (single-letter scheme)
	}

	// At this point, it looks like "scheme:something" without slashes
	// Examples: "file:name:colons.txt", "custom:text"
	// These are NOT valid URIs (missing hierarchical structure), treat as relative filenames
	return true;
};
