const SENSITIVE_PATTERNS: [RegExp, string][] = [
	[/Bearer\s+[\w.~+/=-]+/gi, 'Bearer [redacted]'],
	[/(client_secret=)[^&\s]+/gi, '$1[redacted]'],
	[/(password[">:=\s]+)[^<&"\s]+/gi, '$1[redacted]'],
	[/(authorization[":\s]+)[^,}"\s]+/gi, '$1[redacted]'],
	[/<(?:\w+:)?Password>[\s\S]*?<\/(?:\w+:)?Password>/gi, '<Password>[redacted]</Password>'],
];

export function sanitizeSensitiveText(text: string): string {
	return SENSITIVE_PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

/**
 * Converts any thrown value into a `{ code, message }` pair safe for logging and
 * persistence: tokens, secrets and auth headers are scrubbed, and event contents
 * are never included (callers must only pass transport/provider errors here).
 */
export function sanitizeError(error: unknown): { code: string; message: string } {
	if (error && typeof error === 'object') {
		const { code, message } = error as { code?: unknown; message?: unknown };
		return {
			code: typeof code === 'string' ? code : 'unknown-error',
			message: sanitizeSensitiveText(typeof message === 'string' ? message : String(error)),
		};
	}

	return { code: 'unknown-error', message: sanitizeSensitiveText(String(error)) };
}
