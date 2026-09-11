import { settings } from '../../../../server/settings/cached';

export const SUPPORTED_PROTOCOL_VERSIONS = new Set(['2025-11-25', '2025-06-18', '2025-03-26']);
export const DEFAULT_PROTOCOL_VERSION = '2025-03-26';

const normalizeOrigin = (value: unknown): string | undefined => {
	if (typeof value !== 'string' || value.length === 0) {
		return undefined;
	}

	try {
		return new URL(value).origin;
	} catch {
		return undefined;
	}
};

/**
 * MCP clients running outside a browser do not send Origin. Browser requests must come
 * from the workspace itself or an explicitly configured CORS origin. A wildcard CORS
 * setting is intentionally not accepted because it cannot protect against DNS rebinding.
 */
export const isMcpOriginAllowed = (origin: string | null): boolean => {
	if (origin === null) {
		return true;
	}

	const normalizedOrigin = normalizeOrigin(origin);
	if (!normalizedOrigin) {
		return false;
	}

	if (normalizedOrigin === normalizeOrigin(settings.get('Site_Url'))) {
		return true;
	}

	if (!settings.get<boolean>('API_Enable_CORS')) {
		return false;
	}

	const configuredOrigins = settings.get<string>('API_CORS_Origin') ?? '';
	if (configuredOrigins === '*') {
		return false;
	}

	return configuredOrigins.split(',').some((configuredOrigin) => normalizeOrigin(configuredOrigin.trim()) === normalizedOrigin);
};

export const isMcpProtocolVersionSupported = (version: string | null): boolean =>
	version === null || SUPPORTED_PROTOCOL_VERSIONS.has(version);

export const supportsMcpBatching = (version: string | null): boolean => (version ?? DEFAULT_PROTOCOL_VERSION) === '2025-03-26';
