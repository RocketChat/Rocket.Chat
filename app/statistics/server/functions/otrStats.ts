import { updateCounter } from './updateStatsCounter';
import { Rooms } from '../../../models/server';
import telemetryEvent from '../lib/telemetryEvents';

type otrDataType = { rid: string };

export function otrStats(data: otrDataType): void {
	updateCounter({ settingsId: 'OTR_Count' });

	try {
		// only update DM's
		Rooms.update({ _id: data.rid, t: 'd' }, { $set: { createdOTR: true } });
	} catch (e) {
		throw new Error('error-invalid-rid');
	}
}

telemetryEvent.register('otrStats', otrStats);
