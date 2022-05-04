import { isVideoConfStartProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { startVideoConference } from '../../../../server/lib/startVideoConference';

API.v1.addRoute(
	'video-conference/start',
	{ authRequired: true },
	{
		async post() {
			if (!isVideoConfStartProps(this.bodyParams)) {
				return API.v1.failure('invalid-params', isVideoConfStartProps.errors?.map((e) => e.message).join('\n '));
			}

			// #ToDo: Validate if there is an active provider

			const { userId } = this;

			if (!userId || !(await canAccessRoomIdAsync(this.bodyParams.roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			return API.v1.success({
				data: await startVideoConference(userId, this.bodyParams.roomId),
			});
		},
	},
);
