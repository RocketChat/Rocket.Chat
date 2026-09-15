import Ajv from 'ajv';

import { envSchema } from './schema';
import type { IRocketChatEnv } from './types';

const BOOLEAN_KEYS: (keyof IRocketChatEnv)[] = [
	'ADMIN_EMAIL_VERIFIED',
	'ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS',
	'AUTO_ACCEPT_FINGERPRINT',
	'BYPASS_MONGO_VALIDATION',
	'BYPASS_NODEJS_VALIDATION',
	'DEBUG_DISABLE_USER_AUDIT',
	'DEBUG_SETTINGS',
	'DISABLE_ANIMATION',
	'DISABLE_CUSTOM_SCRIPTS',
	'DISABLE_INTEGRATION_SCRIPTS',
	'DISABLE_MESSAGE_PARSER',
	'DISABLE_MESSAGE_ROUNDTRIP_TRACKING',
	'DISABLE_PRIVATE_APP_INSTALLATION',
	'EXIT_UNHANDLEDPROMISEREJECTION',
	'FREEZE_INTEGRATION_SCRIPTS',
	'IMPORTER_SKIP_APPS_EVENT',
	'SKIP_MONGODEPRECATION_CHECK',
	'TEST_MODE',
];

function normalizeBooleans(raw: Record<string, string | undefined>): Record<string, string | undefined> {
	const copy = { ...raw };
	for (const key of BOOLEAN_KEYS) {
		const val = copy[key]?.toLowerCase();
		if (val === 'yes') {
			copy[key] = 'true';
		} else if (val === 'no') {
			copy[key] = 'false';
		}
	}
	return copy;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}

export function parseEnv(raw: Record<string, string | undefined> = process.env): Readonly<IRocketChatEnv> {
	const ajv = new Ajv({
		coerceTypes: true,
		useDefaults: true,
		removeAdditional: 'all',
		allErrors: true,
	});

	const validate = ajv.compile<IRocketChatEnv>(envSchema);
	const normalized = normalizeBooleans(raw);
	const data = stripUndefined(normalized);

	if (!validate(data)) {
		const errors = validate.errors?.map((e) => `  ${e.instancePath || '/'}: ${e.message}`).join('\n');
		throw new Error(`Environment variable validation failed:\n${errors}`);
	}

	return Object.freeze(data);
}
