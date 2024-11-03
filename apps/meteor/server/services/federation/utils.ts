import { settings } from '../../../app/settings/server';

export function isFederationEnabled(): boolean {
	return settings.get<boolean>('Federation_Matrix_enabled');
}

export function isFederationReady(): boolean {
	return settings.get<string>('Federation_Matrix_configuration_status') === 'Valid';
}

export function throwIfFederationNotEnabledOrNotReady(): void {
	if (!isFederationEnabled()) {
		throw new Error('Federation is not enabled');
	}

	if (!isFederationReady()) {
		throw new Error('Federation configuration is invalid');
	}
}

export function throwIfFederationEnabledButNotReady(): void {
	if (!isFederationEnabled()) {
		return;
	}

	throwIfFederationNotReady();
}

export function throwIfFederationNotReady(): void {
	if (!isFederationReady()) {
		throw new Error('Federation configuration is invalid');
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
