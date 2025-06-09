import type { OutboundComms } from '@rocket.chat/core-typings';

export interface IOutboundMessageProvider {
	providePhoneNumber(provider: OutboundComms.IOutboundMessagePhoneProvider): void;
	provideEmail(provider: OutboundComms.IOutboundMessageEmailProvider): void;
	// getOutboundMessageProviders(type?: 'phone' | 'email'): IOutboundMessageProvider[];
	unregisterProvider(appId: string, providerType: string): void;
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<
		'phone' | 'email',
		(OutboundComms.IOutboundMessagePhoneProvider | OutboundComms.IOutboundMessageEmailProvider)[]
	>;

	public providePhoneNumber(provider: OutboundComms.IOutboundMessagePhoneProvider) {
		this.outboundMessageProviders.set('phone', [...(this.outboundMessageProviders.get('phone') || []), provider]);
	}

	public provideEmail(provider: OutboundComms.IOutboundMessageEmailProvider) {
		this.outboundMessageProviders.set('email', [...(this.outboundMessageProviders.get('email') || []), provider]);
	}

	// public getOutboundMessageProviders(type?: 'phone' | 'email'): IOutboundMessageProvider[] {
	// 	if (type) {
	// 		return this.outboundMessageProviders.get(type);
	// 	}
	//
	// 	return Array.from(this.outboundMessageProviders.values()).flat();
	// }

	public unregisterProvider(appId: string, providerType: 'phone' | 'email'): void {
		const providers = this.outboundMessageProviders.get(providerType);
		if (!providers) {
			return;
		}

		const index = providers.findIndex((provider) => provider.appId === appId);
		if (index === -1) {
			providers.splice(index, 1);
		}
	}
}
