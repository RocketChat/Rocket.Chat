import type { AppAccessorManager } from '.';
import type {
	IOutboundMessageProviders,
	IOutboundEmailMessageProvider,
	IOutboundPhoneMessageProvider,
	ValidOutboundProvider,
} from '../../definition/outboundComunication';
import type { AppManager } from '../AppManager';
import type { OutboundMessageBridge } from '../bridges';
import { OutboundMessageProvider } from './AppOutboundCommunicationProvider';
import { AppPermissionManager } from './AppPermissionManager';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissions } from '../permissions/AppPermissions';

export class AppOutboundCommunicationProviderManager {
	private readonly accessors: AppAccessorManager;

	private readonly bridge: OutboundMessageBridge;

	private outboundMessageProviders: Map<string, Map<ValidOutboundProvider, OutboundMessageProvider>>;

	constructor(private readonly manager: AppManager) {
		this.bridge = this.manager.getBridges().getOutboundMessageBridge();
		this.accessors = this.manager.getAccessorManager();

		this.outboundMessageProviders = new Map<string, Map<ValidOutboundProvider, OutboundMessageProvider>>();
	}

	public isAlreadyDefined(providerId: string, providerType: ValidOutboundProvider): boolean {
		const providersByApp = this.outboundMessageProviders.get(providerId);
		if (!providersByApp) {
			return false;
		}
		if (!providersByApp.get(providerType)) {
			return false;
		}
		return true;
	}

	public addProvider(appId: string, provider: IOutboundMessageProviders): void {
		const app = this.manager.getOneById(appId);
		if (!app) {
			throw new Error('App must exist in order for an outbound provider to be added.');
		}

		if (!AppPermissionManager.hasPermission(appId, AppPermissions.outboundComms.provide)) {
			throw new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.outboundComms.provide],
			});
		}

		if (!this.outboundMessageProviders.has(appId)) {
			this.outboundMessageProviders.set(appId, new Map<ValidOutboundProvider, OutboundMessageProvider>());
		}

		this.outboundMessageProviders.get(appId).set(provider.type, new OutboundMessageProvider(app, provider));
	}

	public async registerProviders(appId: string): Promise<void> {
		if (!this.outboundMessageProviders.has(appId)) {
			return;
		}

		const appProviders = this.outboundMessageProviders.get(appId);
		if (!appProviders) {
			return;
		}

		for await (const [, providerInfo] of appProviders) {
			if (providerInfo.provider.type === 'phone') {
				await this.registerPhoneProvider(appId, providerInfo.provider);
			} else if (providerInfo.provider.type === 'email') {
				await this.registerEmailProvider(appId, providerInfo.provider);
			}
		}
	}

	public async unregisterProviders(appId: string): Promise<void> {
		if (!this.outboundMessageProviders.has(appId)) {
			return;
		}

		const appProviders = this.outboundMessageProviders.get(appId);
		for await (const [, providerInfo] of appProviders) {
			await this.unregisterProvider(appId, providerInfo);
		}

		this.outboundMessageProviders.delete(appId);
	}

	private registerPhoneProvider(appId: string, provider: IOutboundPhoneMessageProvider): Promise<void> {
		return this.bridge.doRegisterPhoneProvider(provider, appId);
	}

	private registerEmailProvider(appId: string, provider: IOutboundEmailMessageProvider): Promise<void> {
		return this.bridge.doRegisterEmailProvider(provider, appId);
	}

	private async unregisterProvider(appId: string, info: OutboundMessageProvider): Promise<void> {
		const key = info.provider.type;

		await this.bridge.doUnRegisterProvider(info.provider, appId);

		info.isRegistered = false;

		const map = this.outboundMessageProviders.get(appId);
		if (map) {
			map.delete(key);
		}
	}

	public getProviderMetadata(appId: string, providerType: ValidOutboundProvider) {
		const providerInfo = this.outboundMessageProviders.get(appId)?.get(providerType);
		if (!providerInfo) {
			throw new Error('provider-not-registered');
		}

		return providerInfo.runGetProviderMetadata(this.manager.getLogStorage(), this.accessors);
	}

	public sendOutboundMessage(appId: string, providerType: ValidOutboundProvider, body: unknown) {
		const providerInfo = this.outboundMessageProviders.get(appId)?.get(providerType);
		if (!providerInfo) {
			throw new Error('provider-not-registered');
		}

		return providerInfo.runSendOutboundMessage(this.manager.getLogStorage(), this.accessors, body);
	}
}
