import { Match } from 'meteor/check';

import { onCheckRoomParams } from '../../../../../server/api/v1/omnichannel/lib/livechat';

onCheckRoomParams.patch((_: any, params) => ({ ...params, sla: Match.Maybe(String), priority: Match.Maybe(String) }));
