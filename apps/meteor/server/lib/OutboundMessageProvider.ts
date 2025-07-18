import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import type { ValidOutboundProvider, IOutboundProvider } from '@rocket.chat/core-typings';

interface IOutboundMessageProvider {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): void;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): void;
	getOutboundMessageProviders(type?: ValidOutboundProvider): IOutboundProvider[];
	unregisterProvider(appId: string, providerType: string): void;
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<ValidOutboundProvider, IOutboundMessageProviders[]>;

	constructor() {
		this.outboundMessageProviders = new Map([
			['phone', []],
			['email', []],
		]);
	}

	public registerPhoneProvider(provider: IOutboundPhoneMessageProvider): void {
		this.outboundMessageProviders.set('phone', [...(this.outboundMessageProviders.get('phone') || []), provider]);
	}

	public registerEmailProvider(provider: IOutboundEmailMessageProvider): void {
		this.outboundMessageProviders.set('email', [...(this.outboundMessageProviders.get('email') || []), provider]);
	}

	public getOutboundMessageProviders(type?: ValidOutboundProvider): IOutboundProvider[] {
		if (type) {
			return Array.from(this.outboundMessageProviders.get(type)?.values() || []).map((provider) => ({
				providerId: provider.appId,
				providerName: provider.name,
				providerType: provider.type,
				...(provider.supportsTemplates && { supportsTemplates: provider.supportsTemplates }),
			}));
		}

		return Array.from(this.outboundMessageProviders.values())
			.flatMap((providers) => providers)
			.map((provider) => ({
				providerId: provider.appId,
				providerName: provider.name,
				supportsTemplates: provider.supportsTemplates,
				providerType: provider.type,
			}));
	}

	public getProviderById(appId: string): IOutboundPhoneMessageProvider | undefined {
		const providers = this.outboundMessageProviders.get('phone') as IOutboundPhoneMessageProvider[] | undefined;

		return providers?.find((provider) => provider.appId === appId);
	}

	public unregisterProvider(appId: string, providerType: ValidOutboundProvider): void {
		const providers = this.outboundMessageProviders.get(providerType);
		if (!providers) {
			return;
		}

		this.outboundMessageProviders.set(
			providerType,
			providers.filter((provider: IOutboundMessageProviders) => provider.appId !== appId),
		);
	}
}
