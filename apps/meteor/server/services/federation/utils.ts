import { normalizeDomain } from '@rocket.chat/xmpp-server';

import { settings } from '../../settings';

export function isFederationEnabled(): boolean {
	return settings.get<boolean>('Federation_Service_Enabled');
}

export function isXMPPServerEnabled(): boolean {
	return settings.get<boolean>('XMPP_Server_Enabled') && isServableDomain(settings.get<string>('XMPP_Server_Domain'));
}

/** Whether the XMPP server would start with `domain`, so a blank or malformed one counts as unset. */
function isServableDomain(domain: string): boolean {
	try {
		normalizeDomain(domain);
		return true;
	} catch {
		return false;
	}
}

export function throwIfFederationNotEnabled(): void {
	if (!isFederationEnabled()) {
		throw new Error('Federation is not enabled');
	}
}

export class FederationMatrixInvalidConfigurationError extends Error {
	constructor(cause?: string) {
		// eslint-disable-next-line prefer-template
		const message = 'Federation configuration is invalid' + (cause ? ',' + cause[0].toLowerCase() + cause.slice(1) : '');

		super(message);

		this.name = 'FederationMatrixInvalidConfiguration';
	}
}
