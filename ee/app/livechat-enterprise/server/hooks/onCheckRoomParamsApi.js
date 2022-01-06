import { Match } from 'meteor/check';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.onCheckRoomApiParams',
	(params) => Object.assign({ ...params }, { priority: Match.Maybe(String) }),
	callbacks.priority.MEDIUM,
	'livechat-on-check-room-params-api',
);
