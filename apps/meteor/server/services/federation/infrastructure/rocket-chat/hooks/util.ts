import { settings } from '../../../../../../app/settings/server';

export function isServiceReady() {
	return settings.get('Federation_Matrix_enabled') && settings.get('Federation_Matrix_configuration_status') === 'Valid';
}
