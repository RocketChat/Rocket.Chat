import { OmnichannelTranscript } from '@rocket.chat/core-services';
import { LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { canAccessRoomAsync } from '../../../../../app/authorization/server/functions/canAccessRoom';

API.v1.addRoute(
	'omnichannel/:rid/request-transcript',
	{ authRequired: true, permissionsRequired: ['request-pdf-transcript'] },
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
			// 1. Call OmnichannelTranscript.requestTranscript()
			// 2. OmnichannelTranscript.requestTranscript() calls QueueWorker.queueWork()
			// 3. QueueWorker.queueWork() eventually calls OmnichannelTranscript.workOnPdf()
			// 4. OmnichannelTranscript.workOnPdf() calls OmnichannelTranscript.pdfComplete() when processing ends
			// 5. OmnichannelTranscript.pdfComplete() sends the messages to the user, and updates the room with the flags
			await OmnichannelTranscript.requestTranscript({
				details: {
					userId: this.userId,
					rid: this.urlParams.rid,
				},
			});

			return API.v1.success();
		},
	},
);
