import type {
	IMediaCallIncomingCallParams,
	IMediaCallModify,
	IMediaCallReportedState,
} from '@rocket.chat/apps-engine/definition/accessors';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class MediaCallModify implements IMediaCallModify {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public createIncomingCall(params: IMediaCallIncomingCallParams): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doCreateIncomingCall', params, 'APP_ID');
	}

	public reportRinging(callId: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doReportRinging', callId, 'APP_ID');
	}

	public reportAnswered(callId: string, features?: string[]): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doReportAnswered', callId, features, 'APP_ID');
	}

	public reportActive(callId: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doReportActive', callId, 'APP_ID');
	}

	public reportEnded(callId: string, reason?: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doReportEnded', callId, reason, 'APP_ID');
	}

	public reportState(callId: string, state: IMediaCallReportedState): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getMediaCallBridge', 'doReportState', callId, state, 'APP_ID');
	}
}
