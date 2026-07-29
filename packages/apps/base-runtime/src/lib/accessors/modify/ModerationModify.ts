import type { IModerationModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

// Every method here takes `appId` as an app-supplied argument (not caller identity); the host
// accessor likewise ignores its constructor appId and forwards the method-arg one. So the appId is
// forwarded raw (see docs/base-runtime-app-id-exceptions.md, bucket B).
export class ModerationModify implements IModerationModify {
	constructor(private readonly bridges: RemoteBridges) {}

	public report(messageId: string, description: string, userId: string, appId: string): Promise<void> {
		return this.bridges.getModerationBridge().doReport(messageId, description, userId, appId) as Promise<void>;
	}

	public dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
		return this.bridges.getModerationBridge().doDismissReportsByMessageId(messageId, reason, action, appId) as Promise<void>;
	}

	public dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
		return this.bridges.getModerationBridge().doDismissReportsByUserId(userId, reason, action, appId) as Promise<void>;
	}
}
