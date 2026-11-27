export const MAX_RECORD_BYTES = 64 * 1024;
export const MAX_NAME_CHARS = 64;
export const MAX_NAME_BYTES = 256;
export const MAX_INSTRUCTIONS_BYTES = 16 * 1024;
export const MAX_TOOLS = 32;
export const MAX_SKILLS = 32;
export const MAX_CHAT_ROOMS = 20;
export const MAX_ROUTES = 32;

export const SEAT_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
export const TOOL_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CHAT_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

const PRIVATE_KEY_HEADER_RE = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/;
const KEY_PREFIX_RE =
	/\b(?:sk-(?:proj-|live-|test-|ant-|or-v1-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{16,}|AIza[0-9A-Za-z_-]{20,}|glpat-[A-Za-z0-9_-]{16,})\b/;
const CLOUD_ACCESS_KEY_RE = /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/;
const BASE64_URL_RUN_RE = /[A-Za-z0-9_-]{48,}/g;

export class AiAgentValidationError extends Error {
	readonly code: string;

	constructor(code: string) {
		// Never echo user text or secret-shaped values in validation errors.
		super(code);
		this.name = 'AiAgentValidationError';
		this.code = code;
	}
}

export function hasControlChar(input: string): boolean {
	for (let i = 0; i < input.length; i += 1) {
		const code = input.charCodeAt(i);
		if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
			return true;
		}
	}
	return false;
}

/**
 * Secret-shape filter for agent `name` and `instructions` after NFC normalization.
 * Refuses private key headers, known provider/code-host prefixes, cloud access keys,
 * JWTs, and >= 48-char mixed-case alphanumeric base64url tokens while allowing URLs,
 * UUIDs, 40-char git SHAs, and ordinary technical prose.
 */
export function containsSecretShape(input: string): boolean {
	const nfc = input.normalize('NFC');
	if (PRIVATE_KEY_HEADER_RE.test(nfc)) {
		return true;
	}
	if (KEY_PREFIX_RE.test(nfc)) {
		return true;
	}
	if (CLOUD_ACCESS_KEY_RE.test(nfc)) {
		return true;
	}
	if (JWT_RE.test(nfc)) {
		return true;
	}

	const withoutUrls = nfc.replace(/https?:\/\/[^\s]+/g, ' ');
	for (const match of withoutUrls.matchAll(BASE64_URL_RUN_RE)) {
		const token = match[0];
		if (/[A-Z]/.test(token) && /[a-z]/.test(token) && /[0-9]/.test(token)) {
			return true;
		}
	}

	return false;
}

/** Validates `name` after NFC: 1..64 Unicode code points, <= 256 UTF-8 bytes, no control chars, no secret shapes. */
export function validateAgentName(raw: string): string {
	if (typeof raw !== 'string') {
		throw new AiAgentValidationError('name-invalid');
	}
	const nfc = raw.normalize('NFC');
	if (nfc.trim().length === 0) {
		throw new AiAgentValidationError('name-invalid');
	}
	const chars = Array.from(nfc).length;
	if (chars < 1 || chars > MAX_NAME_CHARS) {
		throw new AiAgentValidationError('name-too-long');
	}
	if (Buffer.byteLength(nfc, 'utf8') > MAX_NAME_BYTES) {
		throw new AiAgentValidationError('name-too-long');
	}
	if (hasControlChar(nfc)) {
		throw new AiAgentValidationError('name-control-char');
	}
	if (containsSecretShape(nfc)) {
		throw new AiAgentValidationError('text-secret-shape');
	}
	return nfc;
}

/** Validates `instructions` after NFC: 1..16 KiB UTF-8 bytes, no NUL bytes, no secret shapes. */
export function validateAgentInstructions(raw: string): string {
	if (typeof raw !== 'string') {
		throw new AiAgentValidationError('instructions-invalid');
	}
	const nfc = raw.normalize('NFC');
	if (nfc.trim().length === 0) {
		throw new AiAgentValidationError('instructions-invalid');
	}
	if (nfc.includes('\u0000')) {
		throw new AiAgentValidationError('instructions-nul-char');
	}
	if (Buffer.byteLength(nfc, 'utf8') > MAX_INSTRUCTIONS_BYTES) {
		throw new AiAgentValidationError('instructions-too-large');
	}
	if (containsSecretShape(nfc)) {
		throw new AiAgentValidationError('text-secret-shape');
	}
	return nfc;
}

export function validateUniqueIds(
	values: readonly string[],
	{
		min,
		max,
		pattern,
		invalidCode,
		duplicateCode,
	}: {
		min: number;
		max: number;
		pattern: RegExp;
		invalidCode: string;
		duplicateCode: string;
	},
): string[] {
	if (!Array.isArray(values) || values.length < min || values.length > max) {
		throw new AiAgentValidationError(invalidCode);
	}
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of values) {
		if (typeof value !== 'string' || !pattern.test(value)) {
			throw new AiAgentValidationError(invalidCode);
		}
		if (seen.has(value)) {
			throw new AiAgentValidationError(duplicateCode);
		}
		seen.add(value);
		out.push(value);
	}
	return out;
}

export function validateModelRouteId(route: string): string {
	if (typeof route !== 'string' || route.length < 1 || route.length > 128 || hasControlChar(route) || /\s/.test(route)) {
		throw new AiAgentValidationError('route-invalid');
	}
	return route;
}

export function parseModelRoute(route: string): { provider: string; id: string } {
	const validated = validateModelRouteId(route);
	if (validated.startsWith('/') || validated.endsWith('/') || validated.startsWith(':') || validated.endsWith(':')) {
		throw new AiAgentValidationError('route-invalid');
	}

	const slashIndex = validated.indexOf('/');
	const colonIndex = validated.indexOf(':');

	// Canonical agent-core route format is `<provider>/<model id>` (e.g. `openai/gpt-6-luna`
	// or `openrouter/google/gemini-2.5-flash:free`). Check `/` before `:` so model IDs carrying
	// `:free` / `:thinking` suffixes split on the provider prefix, while still accepting legacy
	// `<provider>:<model id>` when `:` precedes any `/`.
	let parsed: { provider: string; id: string };
	if (slashIndex > 0 && (colonIndex === -1 || slashIndex < colonIndex)) {
		parsed = {
			provider: validated.slice(0, slashIndex),
			id: validated.slice(slashIndex + 1),
		};
	} else if (colonIndex > 0) {
		parsed = {
			provider: validated.slice(0, colonIndex),
			id: validated.slice(colonIndex + 1),
		};
	} else {
		parsed = {
			provider: 'openrouter',
			id: validated,
		};
	}

	if (!parsed.provider || !parsed.id || parsed.id.startsWith('/') || parsed.id.startsWith(':')) {
		throw new AiAgentValidationError('route-invalid');
	}
	return parsed;
}

export function formatModelRoute(model: { provider: string; id: string }): string {
	return `${model.provider}/${model.id}`;
}
