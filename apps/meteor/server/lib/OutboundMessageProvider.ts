import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';

interface IOutboundMessageProvider {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): void;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): void;
	getOutboundMessageProviders(type?: 'phone' | 'email'): IOutboundMessageProviders[];
	unregisterProvider(appId: string, providerType: string): void;
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<'phone' | 'email', IOutboundMessageProviders[]>;

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

	public getOutboundMessageProviders(type?: 'phone' | 'email'): IOutboundMessageProviders[] {
		if (type) {
			return Array.from(this.outboundMessageProviders.get(type)?.values() || []);
		}

		return Array.from(this.outboundMessageProviders.values()).flatMap((providers) => providers);
	}

	public unregisterProvider(appId: string, providerType: 'phone' | 'email'): void {
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
