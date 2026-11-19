import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundCommunication/index.js';

import { BaseBridge } from './BaseBridge.js';
import { PermissionDeniedError } from '../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../managers/AppPermissionManager.js';
import { AppPermissions } from '../permissions/AppPermissions.js';

export abstract class OutboundMessageBridge extends BaseBridge {
	public async doRegisterPhoneProvider(info: IOutboundPhoneMessageProvider, appId: string): Promise<void> {
		if (this.hasProviderPermission(appId)) {
			return this.registerPhoneProvider(info, appId);
		}
	}

	public async doRegisterEmailProvider(info: IOutboundEmailMessageProvider, appId: string): Promise<void> {
		if (this.hasProviderPermission(appId)) {
			return this.registerEmailProvider(info, appId);
		}
	}

	public async doUnRegisterProvider(info: IOutboundMessageProviders, appId: string): Promise<void> {
		if (this.hasProviderPermission(appId)) {
			return this.unRegisterProvider(info, appId);
		}
	}

	private hasProviderPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.outboundComms.provide)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.outboundComms.provide],
			}),
		);

		return false;
	}

	protected abstract registerPhoneProvider(info: IOutboundPhoneMessageProvider, appId: string): Promise<void>;

	protected abstract registerEmailProvider(info: IOutboundEmailMessageProvider, appId: string): Promise<void>;

	protected abstract unRegisterProvider(info: IOutboundMessageProviders, appId: string): Promise<void>;
}
