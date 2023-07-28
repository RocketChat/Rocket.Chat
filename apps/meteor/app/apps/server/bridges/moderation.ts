import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ModerationBridge } from '@rocket.chat/apps-engine/server/bridges/ModerationBridge';
import { ModerationReports, Permissions } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { reportMessage } from '../../../../server/lib/moderation/reportMessage';
import { createOrUpdateProtectedRoleAsync } from '../../../../server/lib/roles/createOrUpdateProtectedRole';
import { explorerPermissions, novicePermissions, trustRoles } from '../../../moderation/lib/permissions';

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

		await ModerationReports.hideReportsByMessageId(messageId, appId, reason, action);
	}

	protected async dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is dismissing reports by user id.`);

		if (!userId) {
			throw new Error('Invalid user id');
		}
		await ModerationReports.hideReportsByUserId(userId, appId, reason, action);
	}

	protected async addRepRoles(appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is adding rep roles.`);

		await Promise.all(
			trustRoles.map((id) =>
				createOrUpdateProtectedRoleAsync(id, {
					name: id,
					scope: 'Users',
				}),
			),
		);
	}

	protected async addRepRolePermissions(appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is adding rep role permissions.`);

		await Promise.all([
			Permissions.updateMany(
				{
					_id: { $in: novicePermissions },
				},
				{ $addToSet: { roles: { $each: trustRoles as unknown as string[] } } },
			),
			Permissions.updateMany(
				{
					_id: { $in: explorerPermissions },
				},
				{ $addToSet: { roles: 'explorer' } },
			),
		]);
	}
}
