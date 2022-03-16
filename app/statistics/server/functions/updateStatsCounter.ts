import { settings } from '../../../settings/server';
import { Settings } from '../../../models/server';
import telemetryEvent from '../lib/telemetryEvents';

type updateCounterDataType = { settingsId: string };

export function updateCounter(data: updateCounterDataType): void {
	const countValue: number = settings.get(data.settingsId);

	Settings.updateValueById(data.settingsId, countValue + 1);
}

telemetryEvent.register('updateCounter', updateCounter);
