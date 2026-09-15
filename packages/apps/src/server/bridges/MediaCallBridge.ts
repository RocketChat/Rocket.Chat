import type { IMediaCallIncomingCallParams, IMediaCallReportedState } from '@rocket.chat/apps-engine/definition/accessors';

import { BaseBridge } from './BaseBridge';
import type { IAppsMediaCall } from '../../AppsEngine';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class MediaCallBridge extends BaseBridge {
	public async doGetById(callId: string, appId: string): Promise<IAppsMediaCall | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getById(callId, appId);
		}

		return null;
	}

	public async doCreateIncomingCall(params: IMediaCallIncomingCallParams, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.createIncomingCall(params, appId);
		}
	}

	public async doReportRinging(callId: string, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.reportRinging(callId, appId);
		}
	}

	public async doReportAnswered(callId: string, features: string[] | undefined, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.reportAnswered(callId, features, appId);
		}
	}

	public async doReportActive(callId: string, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.reportActive(callId, appId);
		}
	}

	public async doReportEnded(callId: string, reason: string | undefined, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.reportEnded(callId, reason, appId);
		}
	}

	public async doReportState(callId: string, state: IMediaCallReportedState, appId: string): Promise<void> {
		if (this.hasControlPermission(appId)) {
			return this.reportState(callId, state, appId);
		}
	}

	protected abstract getById(callId: string, appId: string): Promise<IAppsMediaCall | undefined>;

	protected abstract createIncomingCall(params: IMediaCallIncomingCallParams, appId: string): Promise<void>;

	protected abstract reportRinging(callId: string, appId: string): Promise<void>;

	protected abstract reportAnswered(callId: string, features: string[] | undefined, appId: string): Promise<void>;

	protected abstract reportActive(callId: string, appId: string): Promise<void>;

	protected abstract reportEnded(callId: string, reason: string | undefined, appId: string): Promise<void>;

	protected abstract reportState(callId: string, state: IMediaCallReportedState, appId: string): Promise<void>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.mediaCall.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.mediaCall.read],
			}),
		);

		return false;
	}

	private hasControlPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.mediaCall.control)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.mediaCall.control],
			}),
		);

		return false;
	}
}
