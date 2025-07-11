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

	private providerApps: Map<string, boolean>;

	constructor(private readonly manager: AppManager) {
		this.bridge = this.manager.getBridges().getOutboundMessageBridge();
		this.accessors = this.manager.getAccessorManager();

		this.outboundMessageProviders = new Map<string, Map<ValidOutboundProvider, OutboundMessageProvider>>();
		this.providerApps = new Map<string, boolean>();
	}

	public canProviderBeTouchedBy(appId: string, providerType: ValidOutboundProvider): boolean {
		const key = `${appId}-${providerType}`;
		return !this.providerApps.has(key) || false;
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
			throw new Error('App must exist in order for a video conference provider to be added.');
		}

		if (!AppPermissionManager.hasPermission(appId, AppPermissions.outboundComms.provide)) {
			throw new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.outboundComms.provide],
			});
		}

		if (!this.canProviderBeTouchedBy(appId, provider.type)) {
			throw new Error('provider-already-exists');
		}

		if (!this.outboundMessageProviders.has(appId)) {
			this.outboundMessageProviders.set(appId, new Map<ValidOutboundProvider, OutboundMessageProvider>());
		}

		this.outboundMessageProviders.get(appId).set(provider.type, new OutboundMessageProvider(app, provider));
		this.linkAppProvider(appId, provider.type);
	}

	private linkAppProvider(appId: string, providerType: ValidOutboundProvider): void {
		this.providerApps.set(`${appId}-${providerType}`, true);
	}

	public registerProviders(appId: string): void {
		if (!this.outboundMessageProviders.has(appId)) {
			return;
		}

		const appProviders = this.outboundMessageProviders.get(appId);
		if (!appProviders) {
			return;
		}

		for (const [, providerInfo] of appProviders) {
			if (providerInfo.provider.type === 'phone') {
				this.registerPhoneProvider(appId, providerInfo.provider);
			} else if (providerInfo.provider.type === 'email') {
				this.registerEmailProvider(appId, providerInfo.provider);
			}
		}
	}

	public unregisterProviders(appId: string): void {
		if (!this.outboundMessageProviders.has(appId)) {
			return;
		}

		const appProviders = this.outboundMessageProviders.get(appId);
		for (const [, providerInfo] of appProviders) {
			this.unregisterProvider(appId, providerInfo);
		}

		this.outboundMessageProviders.delete(appId);
	}

	private registerPhoneProvider(appId: string, provider: IOutboundPhoneMessageProvider): void {
		this.bridge.doRegisterPhoneProvider(provider, appId);
	}

	private registerEmailProvider(appId: string, provider: IOutboundEmailMessageProvider): void {
		this.bridge.doRegisterEmailProvider(provider, appId);
	}

	private unregisterProvider(appId: string, info: OutboundMessageProvider): void {
		const key = info.provider.type;

		this.bridge.doUnRegisterProvider(info.provider, appId);
		this.providerApps.delete(key);

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
}
