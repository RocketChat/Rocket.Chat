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

	// Check for URI scheme pattern per RFC 3986 Section 3.1:
	// scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
	// If a scheme is present, the URL is absolute.
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(str)) {
		return false;
	}

	return true;
};
