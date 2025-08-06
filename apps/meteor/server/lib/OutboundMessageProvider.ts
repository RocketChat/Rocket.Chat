import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import type { ValidOutboundProvider, IOutboundProvider, IOutboundMessageProvider } from '@rocket.chat/core-typings';

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<ValidOutboundProvider, IOutboundMessageProviders[]>;

	constructor() {
		this.outboundMessageProviders = new Map([
			['phone', []],
			['email', []],
		]);
	}

	public findOneByProviderId(providerId: string) {
		for (const providers of this.outboundMessageProviders.values()) {
			for (const provider of providers) {
				if (provider.appId === providerId) {
					return provider;
				}
			}
		}
		return undefined;
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
				...(provider.documentationUrl && { documentationUrl: provider.documentationUrl }),
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
