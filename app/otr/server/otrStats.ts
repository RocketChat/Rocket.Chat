import { settings } from '../../settings/server';
import { Settings, Rooms } from '../../models/server';

export function otrStats(rid: string): void {
	if (rid) {
		const otrCount = settings.get('OTR_Count');
		if (typeof otrCount !== 'number') {
			return;
		}
		Settings.updateValueById('OTR_Count', otrCount + 1);

		Rooms.update({ _id: rid }, { $set: { createdOTR: true } });
	}
}
