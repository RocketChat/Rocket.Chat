import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { FilterOperators } from 'mongodb';

import { callbacks } from '../../../../../lib/callbacks';
import { restrictQuery } from '../lib/restrictQuery';

callbacks.add(
	'livechat.applyRoomRestrictions',
	async (originalQuery: FilterOperators<IOmnichannelRoom> = {}, unitsFilter?: string[], userId?: string | null) => {
		return restrictQuery({ originalQuery, unitsFilter, userId });
	},
	callbacks.priority.HIGH,
	'livechat-apply-room-restrictions',
);
