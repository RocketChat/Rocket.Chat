import { updateCounter } from './updateStatsCounter';
import { Rooms } from '../../../models/server';

export function otrStats(rid: string): void {
	if (rid) {
		updateCounter('OTR_Count');
		Rooms.update({ _id: rid }, { $set: { createdOTR: true } });
	}
}
