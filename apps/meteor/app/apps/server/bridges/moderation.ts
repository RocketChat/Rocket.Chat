import { ModerationBridge } from '@rocket.chat/apps-engine/server/bridges/ModerationBridge';
import { Meteor } from 'meteor/meteor';
import { ModerationReports } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { reportMessage } from '../../../../server/lib/moderation/reportMessage';
import { deleteMessage } from '../../../lib/server';
import { setUserActiveStatus } from '../../../lib/server/functions/setUserActiveStatus';

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

	protected async deleteMessage(message: IMessage, user: IUser, reason: string, action: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is deleting a message.`);

		if (!message.id) {
			throw new Error('Invalid message id');
		}

		const convertedMsg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const convertedUser = await this.orch.getConverters()?.get('users').convertById(user.id);

		await deleteMessage(convertedMsg, convertedUser);

		await ModerationReports.hideReportsByMessageId(convertedMsg._id, appId, reason, action);
	}

	protected async deactivateUser(
		userId: IUser['id'],
		confirmRelinquish: boolean,
		reason: string,
		action: string,
		appId: string,
	): Promise<void> {
		this.orch.debugLog(`The App ${appId} is deactivating a user.`);

		if (!userId) {
			throw new Error('Invalid user id');
		}
		const convertedUser = await this.orch.getConverters()?.get('users').convertById(userId);

		await setUserActiveStatus(convertedUser.id, false, confirmRelinquish);

		await ModerationReports.hideReportsByUserId(userId, appId, reason, action);
	}

	protected async resetUserAvatar(userId: IUser['id'], appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is resetting a user avatar.`);

		if (!userId) {
			throw new Error('Invalid user id');
		}

		await Meteor.callAsync('resetAvatar', userId);
	}
}
