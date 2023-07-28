import { Rooms } from '@rocket.chat/models';

import telemetryEvent from '../lib/telemetryEvents';
import { updateCounter } from './updateStatsCounter';

type otrDataType = { rid: string };

export async function otrStats(data: otrDataType) {
	updateCounter({ settingsId: 'OTR_Count' });

	await Rooms.setOTRForDMByRoomID(data.rid);
}

telemetryEvent.register('otrStats', otrStats);
