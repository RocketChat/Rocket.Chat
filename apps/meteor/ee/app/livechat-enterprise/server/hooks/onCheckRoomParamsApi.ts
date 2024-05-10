import { Match } from 'meteor/check';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.onCheckRoomApiParams',
	(params) => ({ ...params, sla: Match.Maybe(String), priority: Match.Maybe(String) }),
	callbacks.priority.MEDIUM,
	'livechat-on-check-room-params-api',
);
