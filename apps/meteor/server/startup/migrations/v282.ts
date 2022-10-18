import { LivechatPriority, LivechatRooms, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { isEnterprise } from '../../../ee/app/license/server';

// Migrates priorities to SLAs collection and cleans priorities collection
addMigration({
	version: 282,
	async up() {
		const isEE = isEnterprise();

		// CE may have been EE first, so it may hold priorities which we want to remove
		// IF env is not EE anymore, then just cleaning the collection is enough
		// IF it's still EE, populate new collection with SLAs
		const currentPriorities = await LivechatPriority.find().toArray();
		await LivechatPriority.deleteMany({});

		// If there's no priorities, then no rooms/slas should be modified
		if (!isEE || !currentPriorities.length) {
			return;
		}

		// Since priorityId holds the "SLA ID" at this point, we need to rename the property so it doesnt conflict with current priorities
		// Typing of the prop will be kept as will be reused by the new priorities feature
		// @ts-expect-error - LivechatRooms attachment issue
		await LivechatRooms.updateMany({ priorityId: { $exists: true } }, { $rename: { priorityId: 'slaId' } });
		await OmnichannelServiceLevelAgreements.insertMany(currentPriorities);
	},
});
