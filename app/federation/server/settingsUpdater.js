import { Settings } from '../../models';

let nextStatus;

export function updateStatus(status) {
	Settings.updateValueById('FEDERATION_Status', nextStatus || status);

	nextStatus = null;
}

export function updateNextStatusTo(status) {
	nextStatus = status;
}

export function updateEnabled(enabled) {
	Settings.updateValueById('FEDERATION_Enabled', enabled);
}
