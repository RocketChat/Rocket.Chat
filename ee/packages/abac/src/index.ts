import { ServiceClass } from '@rocket.chat/core-services';
import type { IAbacService } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';

export class AbacService extends ServiceClass implements IAbacService {
	protected name = 'abac';

	/**
	 * Toggles the ABAC flag for a private room.
	 * Only rooms of type 'p' (private channels or teams) are currently eligible.
	 *
	 * @param rid Room ID
	 * @throws Error('error-invalid-room') if the room does not exist or is not a private room
	 */
	async toggleAbacConfigurationForRoom(rid: string): Promise<void> {
		const room = await Rooms.findOneByIdAndType(rid, 'p');

		if (!room) {
			throw new Error('error-invalid-room');
		}

		await Rooms.updateAbacConfigurationById(rid, !room.abac);
	}
}

export default AbacService;
