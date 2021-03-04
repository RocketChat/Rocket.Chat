import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IRoomService } from '../../sdk/types/IRoomService';
import { Authorization } from '../../sdk';

export class RoomService extends ServiceClass implements IRoomService {
	protected name = 'room';

	// constructor(db: Db) {
	// 	super();
	// }

	async addMember(uid: string, rid: string): Promise<boolean> {
		const hasPermission = await Authorization.hasPermission(uid, 'add-user-to-joined-room', rid);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		return true;
	}
}
