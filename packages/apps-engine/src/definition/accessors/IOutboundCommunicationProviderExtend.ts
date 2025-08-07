import type { IOutboundEmailMessageProvider, IOutboundPhoneMessageProvider } from '../outboundComunication';

export interface IOutboundCommunicationProviderExtend {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): Promise<void>;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): Promise<void>;
}
