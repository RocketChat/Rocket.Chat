import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ModerationBridge } from '@rocket.chat/apps-engine/server/bridges/ModerationBridge';
import { ModerationReports } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { reportMessage } from '../../../../server/lib/moderation/reportMessage';

export class AppModerationBridge extends ModerationBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async report(messageId: IMessage['id'], description: string, userId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is creating a new report.`);

		if (!messageId) {
			throw new Error('Invalid message id');
		}

		if (!description) {
			throw new Error('Invalid description');
		}

		await reportMessage(messageId, description, userId || 'rocket.cat');
	}

	protected async dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is dismissing reports by message id.`);

		if (!messageId) {
			throw new Error('Invalid message id');
		}

		await ModerationReports.hideMessageReportsByMessageId(messageId, appId, reason, action);
	}

	protected async dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is dismissing reports by user id.`);

		if (!userId) {
			throw new Error('Invalid user id');
		}
		await ModerationReports.hideMessageReportsByUserId(userId, appId, reason, action);
	}
}
