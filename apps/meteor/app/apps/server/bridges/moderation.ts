import { ModerationBridge } from '@rocket.chat/apps-engine/server/bridges/ModerationBridge';
import type { IMessage } from '@rocket.chat/core-typings';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { reportMessage } from '../../../../server/lib/moderation/reportMessage';

export class AppModerationBridge extends ModerationBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async report(messageId: IMessage['_id'], description: string, userId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is creating a new report.`);

		if (!messageId) {
			throw new Error('Invalid message id');
		}

		if (!description) {
			throw new Error('Invalid description');
		}

		await reportMessage(messageId, description, userId || 'rocket.cat');

		// Meteor.call('reportMessage', { messageId, description });
	}
}
