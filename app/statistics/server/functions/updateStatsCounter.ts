import { settings } from '../../../settings/server';
import { Settings } from '../../../models/server';

export function updateCounter(settingsId: string): void {
	const countValue: number = settings.get(settingsId);

	Settings.updateValueById(settingsId, countValue + 1);
}
