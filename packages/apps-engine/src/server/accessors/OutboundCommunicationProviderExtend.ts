import type { IOutboundCommunicationProviderExtend } from '../../definition/accessors/IOutboundCommunicationProviderExtend';
import type { IOutboundPhoneMessageProvider, IOutboundEmailMessageProvider } from '../../definition/outboundComunication';
import type { AppOutboundCommunicationProviderManager } from '../managers/AppOutboundCommunicationProviderManager';

export class OutboundMessageProviderExtend implements IOutboundCommunicationProviderExtend {
	constructor(
		private readonly manager: AppOutboundCommunicationProviderManager,
		private readonly appId: string,
	) {}

	public registerPhoneProvider(provider: IOutboundPhoneMessageProvider): Promise<void> {
		return Promise.resolve(this.manager.addProvider(this.appId, provider));
	}

	public registerEmailProvider(provider: IOutboundEmailMessageProvider): Promise<void> {
		return Promise.resolve(this.manager.addProvider(this.appId, provider));
	}
}
