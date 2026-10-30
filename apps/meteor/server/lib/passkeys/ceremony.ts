import { ClientSafeError } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';

import { settings } from '../../settings';

const logger = new Logger('Passkeys');

export const CEREMONY_TIMEOUT_MS = 5 * 60 * 1000;

const COSE_ALGORITHM = { EdDSA: -8, ES256: -7, RS256: -257 } as const;

export const SUPPORTED_ALGORITHM_IDS = [COSE_ALGORITHM.EdDSA, COSE_ALGORITHM.ES256, COSE_ALGORITHM.RS256];

const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export const assertPasskeysEnabled = (): void => {
	if (!settings.get<boolean>('Accounts_Passkeys_Enabled')) {
		throw new ClientSafeError('error-not-allowed', 'Passkeys are disabled');
	}
};

/** The relying party every passkey is bound to: the host of the Site URL. */
export const getRelyingParty = (): { id: string; name: string; origin: string } => {
	const siteUrl = new URL(settings.get<string>('Site_Url'));

	return {
		id: siteUrl.hostname,
		name: settings.get<string>('Site_Name') || siteUrl.hostname,
		origin: siteUrl.origin,
	};
};

export const getChallengeExpiry = (): Date => new Date(Date.now() + CEREMONY_TIMEOUT_MS);

/** The one answer to a passkey that is refused, whatever the reason; the reason goes to the server log. */
export const refusePasskey = (reason: string, details: Record<string, unknown> = {}): ClientSafeError => {
	logger.warn({ msg: 'Passkey refused', reason, ...details });
	return new ClientSafeError('error-passkey-invalid', 'The passkey could not be verified');
};

/**
 * The challenge a ceremony response answers. The library hands the parsed client data to callbacks unchecked, so it is
 * read here and only a well-formed challenge string is ever looked up. Responses made in a cross-origin frame are refused.
 */
export const getResponseChallenge = (clientDataJSON: string): string => {
	let clientData: unknown;
	try {
		clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString('utf8'));
	} catch {
		throw refusePasskey('the client data is not JSON');
	}

	const { challenge, crossOrigin } = (clientData ?? {}) as { challenge?: unknown; crossOrigin?: unknown };
	if (typeof challenge !== 'string' || !CHALLENGE_PATTERN.test(challenge)) {
		throw refusePasskey('the client data carries no well-formed challenge');
	}
	if (crossOrigin === true) {
		throw refusePasskey('the ceremony ran in a cross-origin frame');
	}

	return challenge;
};
