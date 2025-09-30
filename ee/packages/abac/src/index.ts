import { Rooms } from '@rocket.chat/models';

export async function toggleAbacConfigurationForRoom(rid: string) {
	const room = await Rooms.findOneByIdAndType(rid, 'p');

	if (!room) {
		throw new Error('error-invalid-room');
	}

	await Rooms.updateAbacConfigurationById(rid, !room.abac);
}
