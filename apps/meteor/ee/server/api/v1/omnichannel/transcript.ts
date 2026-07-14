import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../../server/api/ApiClass';
import { canAccessRoomAsync } from '../../../../../server/lib/authorization/canAccessRoom';
import { requestPdfTranscript } from '../../../lib/omnichannel/requestPdfTranscript';

const requestTranscriptResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const requestTranscriptEndpoints = API.v1.post(
	'omnichannel/:rid/request-transcript',
	{
		authRequired: true,
		permissionsRequired: ['request-pdf-transcript'],
		license: ['livechat-enterprise'],
		response: {
			200: requestTranscriptResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		// The typed router does not turn thrown errors into 400s (the legacy addRoute wrapper did), so the
		// invalid-room / access / requestPdfTranscript (room-still-open, improper-room-state) failures are
		// caught here and returned as 400 to preserve the previous behavior.
		try {
			const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'open' | 'v' | 't' | 'pdfTranscriptFileId'>>(
				this.urlParams.rid,
				{
					projection: { _id: 1, open: 1, v: 1, t: 1, pdfTranscriptFileId: 1 },
				},
			);
			if (!room) {
				return API.v1.failure('error-invalid-room');
			}

			if (!(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.failure('error-not-allowed');
			}

			// Flow is as follows:
			// 1. On Test Mode, call Transcript.workOnPdf directly
			// 2. On Normal Mode, call QueueWorker.queueWork to queue the work
			// 3. OmnichannelTranscript.workOnPdf will be called by the worker to generate the transcript
			// 4. We be happy :)
			await requestPdfTranscript(room, this.userId);

			return API.v1.success();
		} catch (e) {
			return API.v1.failure(e instanceof Error ? e.message : String(e));
		}
	},
);

type RequestTranscriptEndpoints = ExtractRoutesFromAPI<typeof requestTranscriptEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends RequestTranscriptEndpoints {}
}
