import { Meteor } from 'meteor/meteor';

import { Base } from './_Base';

const UNIQUE_QUEUE_ID = 'queue';

export class OmnichannelQueue extends Base {
	constructor() {
		super('omnichannel_queue');
		// this.tryEnsureIndex({ locked: 1 }, { sparse: true });
	}

	initQueue() {
		return this.upsert({
			_id: UNIQUE_QUEUE_ID,
		}, {
			$unset: {
				stoppedAt: 1,
			},
			$set: {
				startedAt: new Date(),
				locked: false,
			},
		});
	}

	stopQueue() {
		return this.update({
			_id: UNIQUE_QUEUE_ID,
		}, {
			$set: {
				stoppedAt: new Date(),
				locked: false,
			},
		});
	}

	lockQueue() {
		const query = {
			_id: UNIQUE_QUEUE_ID,
			locked: false,
		};

		const sort = {
			_id: 1,
		};

		const update = {
			$set: {
				locked: true,
			},
		};

		const collectionObj = this.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

		const queue = findAndModify(query, sort, update);
		return queue && queue.value;
	}

	unlockQueue() {
		const query = {
			_id: UNIQUE_QUEUE_ID,
		};

		const sort = {
			_id: 1,
		};

		const update = {
			$set: {
				locked: false,
			},
		};

		const collectionObj = this.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

		const queue = findAndModify(query, sort, update);
		return queue && queue.value;
	}
}

export default new OmnichannelQueue();
