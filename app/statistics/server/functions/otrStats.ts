import { updateCounter } from './updateStatsCounter';
import { Rooms } from '../../../models/server';

export function otrStats(rid: string): void {
	updateCounter('OTR_Count');

	try {
		Rooms.update({ _id: rid }, { $set: { createdOTR: true } });
	} catch (e) {
		throw new Error('error-invalid-rid');
	}
}
