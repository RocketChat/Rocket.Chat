import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { BigBlueButtonApp } from '../BigBlueButtonApp';

export class EventHookEndpoint extends ApiEndpoint {
	public path: string = 'hook/:id';

	constructor(public app: BigBlueButtonApp) {
		super(app);
	}

	private reject(): IApiResponse {
		return {
			status: HttpStatusCode.NOT_FOUND,
		};
	}

	public async post(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<IApiResponse> {
		this.app.getLogger().log(request);

		request.params


			// // TODO check checksum
			// const event = JSON.parse(this.bodyParams.event)[0];
			// const eventType = event.data.id;
			// const meetingID = event.data.attributes.meeting['external-meeting-id'];
			// const rid = meetingID.replace(settings.get('uniqueID'), '');

			// SystemLogger.debug(eventType, rid);

			// if (eventType === 'meeting-ended') {
			// 	saveStreamingOptions(rid, {});
			// }		
	}
}
