import type { IAppServerOrchestrator, IAppsMediaCall } from '@rocket.chat/apps';
import { MediaCallBridge } from '@rocket.chat/apps/dist/server/bridges/MediaCallBridge';
import type { IMediaCallIncomingCallParams, IMediaCallReportedState } from '@rocket.chat/apps-engine/definition/accessors';
import { MediaCall } from '@rocket.chat/core-services';
import type { MediaCallContact } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { toAppMediaCall } from '../converters/mediaCalls';

export class AppMediaCallBridge extends MediaCallBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<IAppsMediaCall | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the media call byId: "${callId}"`);

		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			return undefined;
		}

		return toAppMediaCall(call);
	}

	protected async createIncomingCall(params: IMediaCallIncomingCallParams, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is reporting an incoming cti call for user "${params.userId}"`);

		const from: MediaCallContact = {
			type: params.from.type,
			id: params.from.id,
			...(params.from.username && { username: params.from.username }),
			...(params.from.displayName && { displayName: params.from.displayName }),
			...(params.from.sipExtension && { sipExtension: params.from.sipExtension }),
		};

		await MediaCall.createIncomingCtiCall({
			userId: params.userId,
			from,
			...(params.device && { device: params.device }),
			...(params.features && { features: params.features }),
		});
	}

	protected async reportRinging(callId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports cti call "${callId}" is ringing`);
		await MediaCall.reportCtiCallRinging(callId);
	}

	protected async reportAnswered(callId: string, features: string[] | undefined, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports cti call "${callId}" was answered`);
		await MediaCall.reportCtiCallAnswered(callId, features);
	}

	protected async reportActive(callId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports cti call "${callId}" is active`);
		await MediaCall.reportCtiCallActive(callId);
	}

	protected async reportEnded(callId: string, reason: string | undefined, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports cti call "${callId}" ended`);
		await MediaCall.reportCtiCallEnded(callId, reason);
	}

	protected async reportState(callId: string, state: IMediaCallReportedState, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports cti call "${callId}" state`);
		await MediaCall.reportCtiCallState(callId, state);
	}

	protected async notifyDevicesChanged(userId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} reports the media call devices of user "${userId}" changed`);
		await MediaCall.notifyUserMediaDevicesChanged(userId);
	}
}
