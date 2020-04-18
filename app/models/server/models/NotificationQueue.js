import { Base } from './_Base';

export class NotificationQueue extends Base {
	constructor() {
		super('notification_queue');
		this.tryEnsureIndex({ sid: 1 });
		// this.tryEnsureIndex({ 'room._id': 1, date: 1 }, { unique: true });
	}
}

export default new NotificationQueue();
