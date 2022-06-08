import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { PexipApp } from '../PexipApp';
import type { PolicyServerResponse } from '../definition/PolicyServerResponse';
import type { ServiceConfiguration } from '../definition/ServiceConfiguration';
import type { SerializedServiceConfigurationRequest } from '../definition/ServiceConfigurationRequest';

export class ServerConfigurationEndpoint extends ApiEndpoint {
	public path: string = 'policy/v1/service/configuration';

	constructor(public app: PexipApp) {
		super(app);
	}

	private pexipResponse(result: ServiceConfiguration, action?: 'continue' | 'reject'): IApiResponse {
		return {
			status: HttpStatusCode.OK,
			headers: {
				'content-type': 'application/json',
			},
			content: JSON.stringify({
				status: 'success',
				...(action ? { action } : {}),
				result,
			}),
		};
	}

	private reject(): IApiResponse {
		return {
			status: HttpStatusCode.NOT_FOUND,
		};
	}

	public async get(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<IApiResponse> {
		this.app.getLogger().log(request);

		const serviceRequest = request.query as SerializedServiceConfigurationRequest;

		const { local_alias: callId } = serviceRequest;
		if (!callId) {
			return this.reject();
		}

		const call = await read.getVideoConferenceReader().getById(callId);
		if (!call) {
			return this.reject();
		}

		const title = call.type === 'videoconference' ? call.title : '';

		const { createHash } = require('crypto');
		const hostHash = createHash('sha256').update(`${callId}${call.createdBy._id}`).digest('hex');
		const guestHash = createHash('sha256').update(`${callId}${call.rid}`).digest('hex');
		const hostPin = String(BigInt(`0x${hostHash}`)).slice(-6);
		const guestPin = String(BigInt(`0x${guestHash}`)).slice(-6);

		const extender = await modify.getExtender().extendVideoConference(callId, null as unknown as IUser);
		extender.setProviderData({ hostPin, guestPin });

		return this.pexipResponse({
			service_type: 'conference',
			name: call._id,
			service_tag: 'rocket.chat',
			description: title,
			pin: hostPin,
			allow_guests: true,
			guest_pin: guestPin,
			locked: true,
			ivr_theme_name: 'rocket.chat',
			call_type: 'video',
			view: 'one_main_seven_pips',
			local_display_name: title,
		}, 'continue');
	}
}
