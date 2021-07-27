import { Match } from 'meteor/check';

import { callbacks } from '../../../../../app/callbacks';

callbacks.add('livechat.onCheckRoomApiParams', (params) => Object.assign({ ...params }, { priority: Match.Maybe(String) }), callbacks.priority.MEDIUM, 'livechat-on-check-room-params-api');
