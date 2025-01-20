import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChanged } from '../../../lib/server/lib/notifyListener';
import telemetryEvent from '../lib/telemetryEvents';

type updateCounterDataType = { settingsId: string };

export function updateCounter(data: updateCounterDataType): void {
	void (async () => {
		const value = await Settings.incrementValueById(data.settingsId, 1, { returnDocument: 'after' });
		if (value) {
			void notifyOnSettingChanged(value);
		}
	})();
}

telemetryEvent.register('updateCounter', updateCounter);
