import type { ICallHistoryPage, ICallHistoryQuery } from '@rocket.chat/apps-engine/definition/accessors/ICallHistoryRead';
import type { ICallHistoryEntry } from '@rocket.chat/apps-engine/definition/callHistory';

import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class CallHistoryBridge extends BaseBridge {
	public async doGetById(historyId: string, appId: string): Promise<ICallHistoryEntry | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getById(historyId, appId);
		}
	}

	public async doGetByCallId(callId: string, appId: string): Promise<ICallHistoryEntry[]> {
		if (this.hasReadPermission(appId)) {
			return this.getByCallId(callId, appId);
		}

		return [];
	}

	public async doFind(query: ICallHistoryQuery, appId: string): Promise<ICallHistoryPage | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.find(query, appId);
		}
	}

	protected abstract getById(historyId: string, appId: string): Promise<ICallHistoryEntry | undefined>;

	protected abstract getByCallId(callId: string, appId: string): Promise<ICallHistoryEntry[]>;

	protected abstract find(query: ICallHistoryQuery, appId: string): Promise<ICallHistoryPage>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.mediaCall.history)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.mediaCall.history],
			}),
		);

		return false;
	}
}
