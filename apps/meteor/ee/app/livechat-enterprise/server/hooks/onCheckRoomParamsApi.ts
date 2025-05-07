import { Match } from 'meteor/check';

import { onCheckRoomParams } from '../../../../../app/livechat/server/api/lib/livechat';

onCheckRoomParams.patch((_: any, params) => ({ ...params, sla: Match.Maybe(String), priority: Match.Maybe(String) }));
