import { Settings } from '@rocket.chat/models';

import telemetryEvent from '../lib/telemetryEvents';

type updateCounterDataType = { settingsId: string };

export function updateCounter(data: updateCounterDataType): void {
	Settings.incrementValueById(data.settingsId);
}

telemetryEvent.register('updateCounter', updateCounter);
