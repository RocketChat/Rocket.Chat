import { Settings } from '../../models';

export function updateStatus(status) {
	Settings.updateValueById('FEDERATION_Status', status);
}

export function updateEnabled(enabled) {
	Settings.updateValueById('FEDERATION_Enabled', enabled);
}
