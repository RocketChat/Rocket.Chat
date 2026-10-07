export const REDACTED = '[redacted]';

const AUTH_SCHEMES = 'Bearer|NTLM|Basic|Negotiate|Digest';

const SECRET_KEYS = 'access_token|refresh_token|id_token|client_secret|assertion|password';

const SENSITIVE_KEY = /password|secret|token|authorization|credential|assertion/i;

const LOCATION_KEY = /url|uri|endpoint|host/i;

const PATTERNS: [RegExp, string][] = [
	// An Authorization header, as a raw line or an object property.
	[new RegExp(`("?authorization"?\\s*[:=]\\s*"?)((?:${AUTH_SCHEMES})\\s+)?[^"\\s,}]+`, 'gi'), `$1$2${REDACTED}`],
	// The same schemes quoted inside prose, for example an error message repeating the header it sent.
	[new RegExp(`\\b(${AUTH_SCHEMES})\\s+[A-Za-z0-9+/=._~-]{8,}`, 'gi'), `$1 ${REDACTED}`],
	// Credential fields, JSON or form encoded.
	[new RegExp(`("?(?:${SECRET_KEYS})"?\\s*[:=]\\s*"?)[^"&\\s,}]+`, 'gi'), `$1${REDACTED}`],
	// WS-Security password elements, and any password-ish element in a SOAP envelope.
	[/(<[^>]*(?:Password|Secret)[^>]*>)[^<]*(<\/)/gi, `$1${REDACTED}$2`],
];

export const scrubText = (value: string): string =>
	PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);

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
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key,
				SENSITIVE_KEY.test(key) && !LOCATION_KEY.test(key) ? REDACTED : scrubForLog(item, depth + 1),
			]),
		);
	}

	return value;
};
