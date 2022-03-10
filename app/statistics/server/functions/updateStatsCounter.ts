import { settings } from '../../../settings/server';
import { Settings } from '../../../models/server';

export function updateCounter(settingsId: string): void {
	const countValue = settings.get(settingsId);
	if (typeof countValue !== 'number') {
		return;
	}
	console.log(countValue, settingsId);
	Settings.updateValueById(settingsId, countValue + 1);
}
