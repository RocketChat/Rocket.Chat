import { LivechatVoip } from '@rocket.chat/core-services';
import { VoipRoom } from '@rocket.chat/models';
import { isVoipEventsProps } from '@rocket.chat/rest-typings';

import { canAccessRoomAsync } from '../../../../authorization/server';
import { API } from '../../api';

API.v1.addRoute(
	'voip/events',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isVoipEventsProps },
	{
		async post() {
			const { rid, event, comment } = this.bodyParams;

			const room = await VoipRoom.findOneVoipRoomById(rid);
			if (!room) {
				return API.v1.notFound();
			}
			if (!(await canAccessRoomAsync(room, this.user))) {
				return API.v1.unauthorized();
			}

			return API.v1.success(await LivechatVoip.handleEvent(event, room, this.user, comment));
		},
	},
);
