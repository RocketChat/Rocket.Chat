import { settings } from '../../../../../../app/settings/server';

export function verifyFederationReady() {
	if (!settings.get('Federation_Matrix_enabled')) {
		throw new Error('Federation is not enabled');
	}

	if (settings.get('Federation_Matrix_configuration_status') !== 'Valid') {
		throw new Error('Federation configuration is invalid, can not perform this action');
	}
}
