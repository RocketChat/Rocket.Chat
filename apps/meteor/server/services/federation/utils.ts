import { settings } from '../../../app/settings/server';

export function isFederationEnabled(): boolean {
	return settings.get<boolean>('Federation_Service_Enabled');
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
