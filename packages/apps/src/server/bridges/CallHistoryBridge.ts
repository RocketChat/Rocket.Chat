import type {
	ICallHistorySearchFilters,
	ICallHistorySearchPagination,
	ICallHistorySearchResult,
} from '@rocket.chat/apps-engine/definition/accessors';
import type { ICallHistoryItem } from '@rocket.chat/apps-engine/definition/callHistory';

import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class CallHistoryBridge extends BaseBridge {
	public async doGetById(id: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined> {
		if (this.hasHistoryPermission(appId)) {
			return this.getById(id, uid, appId);
		}

		return undefined;
	}

	public async doGetByCallId(callId: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined> {
		if (this.hasHistoryPermission(appId)) {
			return this.getByCallId(callId, uid, appId);
		}

		return undefined;
	}

	public async doSearch(
		uid: string,
		filters: ICallHistorySearchFilters | undefined,
		pagination: ICallHistorySearchPagination | undefined,
		appId: string,
	): Promise<ICallHistorySearchResult | undefined> {
		if (this.hasHistoryPermission(appId)) {
			return this.search(uid, filters, pagination, appId);
		}

		return undefined;
	}

	protected abstract getById(id: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined>;

	protected abstract getByCallId(callId: string, uid: string, appId: string): Promise<ICallHistoryItem | undefined>;

	protected abstract search(
		uid: string,
		filters: ICallHistorySearchFilters | undefined,
		pagination: ICallHistorySearchPagination | undefined,
		appId: string,
	): Promise<ICallHistorySearchResult>;

	private hasHistoryPermission(appId: string): boolean {
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
