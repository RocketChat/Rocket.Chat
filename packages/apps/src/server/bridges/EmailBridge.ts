import type { IEmail } from '@rocket.chat/apps-engine/definition/email/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export abstract class EmailBridge extends BaseBridge {
	public async doSendEmail(email: IEmail, appId: string): Promise<void> {
		if (this.hasWritePermission(appId)) {
			return this.sendEmail(email, appId);
		}
	}

	protected abstract sendEmail(email: IEmail, appId: string): Promise<void>;

	private hasWritePermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.email.send)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.email.send],
			}),
		);

		return false;
	}
}
