import { Settings } from '../../../models/server';
import telemetryEvent from '../lib/telemetryEvents';

type updateCounterDataType = { settingsId: string };

export function updateCounter(data: updateCounterDataType): void {
	Settings.incrementValueById(data.settingsId);
}

telemetryEvent.register('updateCounter', updateCounter);
