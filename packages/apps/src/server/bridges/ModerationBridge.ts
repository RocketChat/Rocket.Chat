import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/index.js';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export abstract class ModerationBridge extends BaseBridge {
	public async doReport(messageId: IMessage['id'], description: string, userId: string, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.report(messageId, description, userId, appId);
		}
	}

	public async doDismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.dismissReportsByMessageId(messageId, reason, action, appId);
		}
	}

	public async doDismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.dismissReportsByUserId(userId, reason, action, appId);
		}
	}

	protected abstract report(messageId: string, description: string, userId: string, appId: string): Promise<void>;

	protected abstract dismissReportsByMessageId(messageId: string, reason: string, action: string, appId: string): Promise<void>;

	protected abstract dismissReportsByUserId(userId: string, reason: string, action: string, appId: string): Promise<void>;

	private hasWritePermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.moderation.write)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.moderation.write],
			}),
		);

		return false;
	}
}
