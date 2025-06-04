export interface IOutboundMessageProvider {
	registerProvider(provider: any): void;
	unregisterProvider(provider: any): void;
	// providePhoneNumber(provider: IOutboundPhoneMessagePrpvoder): void;
	// provideEmail(provider: IOutboudEmailMessageProvider): void;
	// getOutboundMessageProviders(): IOutboundMessageProvider[];
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<'phone' | 'email', (string | string)[]>;

	public registerProvider(provider: any): void {
		this.outboundMessageProviders.set('phone', [...(this.outboundMessageProviders.get('phone') || []), provider]);
	}

	public unregisterProvider(provider: any): void {
		const index = this.outboundMessageProviders.get(provider);
		if (!index) {
			return;
		}

		this.outboundMessageProviders.delete(provider);
	}
}
