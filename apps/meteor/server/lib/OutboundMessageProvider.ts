import type { OutboundComms } from '@rocket.chat/core-typings';

interface IOutboundMessageProvider {
	registerPhoneProvider(provider: OutboundComms.IOutboundMessagePhoneProvider): void;
	registerEmailProvider(provider: OutboundComms.IOutboundMessageEmailProvider): void;
	getOutboundMessageProviders(type?: 'phone' | 'email'): OutboundComms.IOutboundProviders[];
	unregisterProvider(appId: string, providerType: string): void;
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<'phone' | 'email', OutboundComms.IOutboundProviders[]>;

	constructor() {
		this.outboundMessageProviders = new Map([
			['phone', []],
			['email', []],
		]);
	}

	public registerPhoneProvider(provider: OutboundComms.IOutboundMessagePhoneProvider): void {
		this.outboundMessageProviders.set('phone', [...(this.outboundMessageProviders.get('phone') || []), provider]);
	}

	public registerEmailProvider(provider: OutboundComms.IOutboundMessageEmailProvider): void {
		this.outboundMessageProviders.set('email', [...(this.outboundMessageProviders.get('email') || []), provider]);
	}

	public getOutboundMessageProviders(type?: 'phone' | 'email'): OutboundComms.IOutboundProviders[] {
		if (type) {
			const providers = this.outboundMessageProviders.get(type);
			return providers ? Array.from(providers.values()).flat() : [];
		}

		return Array.from(this.outboundMessageProviders.values()).flat();
	}

	public unregisterProvider(appId: string, providerType: 'phone' | 'email'): void {
		const providers = this.outboundMessageProviders.get(providerType);
		if (!providers) {
			return;
		}

		this.outboundMessageProviders.set(
			providerType,
			providers.filter((provider: OutboundComms.IOutboundProviders) => provider.appId !== appId),
		);
	}
}
