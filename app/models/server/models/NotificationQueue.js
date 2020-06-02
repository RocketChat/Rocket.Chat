import { Base } from './_Base';

export class NotificationQueue extends Base {
	constructor() {
		super('notification_queue');
		this.tryEnsureIndex({ uid: 1 });
		this.tryEnsureIndex({ ts: 1 }, { expireAfterSeconds: 2 * 60 * 60 });
		this.tryEnsureIndex({ schedule: 1 }, { sparse: true });
		this.tryEnsureIndex({ sending: 1 }, { sparse: true });
	}
}

export default new NotificationQueue();
