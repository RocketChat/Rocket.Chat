import { settings } from '../../../app/settings/server';

export function isFederationEnabled() {
	return settings.get<boolean>('Federation_Matrix_enabled');
}

export function isFederationReady() {
	return settings.get<string>('Federation_Matrix_configuration_status') === 'Valid';
}

export function verifyFederationReady() {
	if (!isFederationEnabled()) {
		throw new Error('Federation is not enabled');
	}

	if (!isFederationReady()) {
		throw new FederationMatrixInvalidConfigurationError();
	}
}

export class FederationMatrixInvalidConfigurationError extends Error {
	constructor(cause?: string) {
		const message = 'Federation configuration is invalid' + (cause ? ',' + cause[0].toLowerCase() + cause.slice(1) : '');

		super(message);

		this.name = 'FederationMatrixInvalidConfiguration';
	}
}
