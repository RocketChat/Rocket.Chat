import type { IModerationModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

// Every method here takes `appId` as an app-supplied argument (not caller identity); the host
// accessor likewise ignores its constructor appId and forwards the method-arg one. So the appId is
// forwarded raw (see docs/base-runtime-app-id-exceptions.md, bucket B).
export class ModerationModify implements IModerationModify {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public report(messageId: string, description: string, userId: string, appId: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getModerationBridge', 'doReport', messageId, description, userId, appId);
	}

	public dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getModerationBridge', 'doDismissReportsByMessageId', messageId, reason, action, appId);
	}

	public dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
		return bridgeCall<void>(this.senderFn, 'getModerationBridge', 'doDismissReportsByUserId', userId, reason, action, appId);
	}
}
