import { LivechatUnit } from '@rocket.chat/models';
import { getUnitsFromUser } from '@rocket.chat/omni-core-ee';

import type { CheckUnitsFromUser } from '../../../../../app/livechat/server/api/lib/livechat';
import { checkUnitsFromUser } from '../../../../../app/livechat/server/api/lib/livechat';

checkUnitsFromUser.patch(async (_next, { businessUnit, userId }: CheckUnitsFromUser) => {
	if (!businessUnit) {
		return;
	}
	const unitsFromUser = await getUnitsFromUser(userId);
	const unit = await LivechatUnit.findOneById(businessUnit, { projection: { _id: 1 } }, { unitsFromUser });
	if (!unit) {
		throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
	}
});
