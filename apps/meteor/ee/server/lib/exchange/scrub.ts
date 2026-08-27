export const REDACTED = '[redacted]';

const AUTH_SCHEMES = 'Bearer|NTLM|Basic|Negotiate|Digest';

const PATTERNS: [RegExp, string][] = [
	// An Authorization header, as a raw line or an object property. The scheme is kept because knowing
	// whether NTLM or Basic was rejected is exactly what an admin needs.
	[new RegExp(`("?[Aa]uthorization"?\\s*[:=]\\s*"?)((?:${AUTH_SCHEMES})\\s+)?[^"\\s,}]+`, 'g'), `$1$2${REDACTED}`],
	// The same schemes quoted inside prose, for example an error message repeating the header it sent.
	[new RegExp(`\\b(${AUTH_SCHEMES})\\s+[A-Za-z0-9+/=._~-]{8,}`, 'gi'), `$1 ${REDACTED}`],
	// OAuth token and secret fields, JSON or form encoded.
	[/("?(?:access_token|refresh_token|id_token|client_secret|assertion)"?\s*[:=]\s*"?)[^"&\s,}]+/gi, `$1${REDACTED}`],
	// WS-Security password elements, and any password-ish element in a SOAP envelope.
	[/(<[^>]*(?:Password|Secret)[^>]*>)[^<]*(<\/)/gi, `$1${REDACTED}$2`],
	// Form encoded password fields.
	[/\b(password\s*[:=]\s*)[^&\s,}]+/gi, `$1${REDACTED}`],
];

export const scrubText = (value: string): string =>
	PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);

// Produces something safe to hand a logger or exception message.
export const scrubForLog = (value: unknown, depth = 0): unknown => {
	if (depth > 4) {
		return '[truncated]';
	}

	if (typeof value === 'string') {
		return scrubText(value);
	}

	if (value instanceof Error) {
		return {
			name: value.name,
			message: scrubText(value.message),
			...('code' in value && typeof value.code === 'string' ? { code: value.code } : {}),
			...('detail' in value && typeof value.detail === 'string' ? { detail: scrubText(value.detail) } : {}),
		};
	}

	if (Array.isArray(value)) {
		return value.map((item) => scrubForLog(item, depth + 1));
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubForLog(item, depth + 1)]));
	}

	return value;
};
