import { updateCounter } from './updateStatsCounter';
import { Rooms } from '../../../models/server';
import telemetryEvent from '../lib/telemetryEvents';

type otrDataType = { rid: string };

export function otrStats(data: otrDataType): void {
	updateCounter({ settingsId: 'OTR_Count' });

	Rooms.setOTRForDMByRoomID(data.rid);
}

telemetryEvent.register('otrStats', otrStats);
