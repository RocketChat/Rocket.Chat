import { LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { canAccessRoomAsync } from '../../../../../app/authorization/server/functions/canAccessRoom';
import { requestPdfTranscript } from '../lib/requestPdfTranscript';

API.v1.addRoute(
	'omnichannel/:rid/request-transcript',
	{ authRequired: true, permissionsRequired: ['request-pdf-transcript'], license: ['livechat-enterprise'] },
	{
		async post() {
			const room = await LivechatRooms.findOneById(this.urlParams.rid);
			if (!room) {
				throw new Error('error-invalid-room');
			}

			if (!(await canAccessRoomAsync(room, { _id: this.userId }))) {
				throw new Error('error-not-allowed');
			}

			// Flow is as follows:
			// 1. On Test Mode, call Transcript.workOnPdf directly
			// 2. On Normal Mode, call QueueWorker.queueWork to queue the work
			// 3. OmnichannelTranscript.workOnPdf will be called by the worker to generate the transcript
			// 4. We be happy :)
			await requestPdfTranscript(room, this.userId);

			return API.v1.success();
		},
	},
);
