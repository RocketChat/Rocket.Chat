import { BaseRaw } from './BaseRaw';

export class LivechatInquiryRaw extends BaseRaw {
	findOneQueuedByRoomId(rid) {
		const query = {
			rid,
			status: 'queued',
		};
		return this.findOne(query);
	}

	findOneByRoomId(rid) {
		const query = {
			rid,
		};
		return this.findOne(query);
	}
}
