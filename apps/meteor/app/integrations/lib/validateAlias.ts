export const INTEGRATION_ALIAS_MAX_LENGTH = 60;

const ALIAS_ALLOWED_CHARACTERS = /^[\p{L}\p{N} ._'-]+$/u;

export const validateIntegrationAlias = (alias: string | undefined): 'ok' | 'too-long' | 'invalid-characters' => {
	if (typeof alias !== 'string') {
		return 'ok';
	}

	const trimmedAlias = alias.trim();

	if (!trimmedAlias) {
		return 'ok';
	}

	if (trimmedAlias.length > INTEGRATION_ALIAS_MAX_LENGTH) {
		return 'too-long';
	}

	if (!ALIAS_ALLOWED_CHARACTERS.test(trimmedAlias)) {
		return 'invalid-characters';
	}

	return 'ok';
};
