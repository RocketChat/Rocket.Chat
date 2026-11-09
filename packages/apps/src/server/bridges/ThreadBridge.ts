import type { ITypingOptions } from '@rocket.chat/apps-engine/definition/accessors/INotifier.js';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export interface ITypingDescriptor extends ITypingOptions {
	isTyping: boolean;
}

export abstract class ThreadBridge extends BaseBridge {
	public async doGetById(messageId: string, appId: string): Promise<Array<IMessage>> {
		if (this.hasReadPermission(appId)) {
			return this.getById(messageId, appId);
		}
	}

	protected abstract getById(messageId: string, appId: string): Promise<Array<IMessage>>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.threads.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.threads.read],
			}),
		);

		return false;
	}
}
