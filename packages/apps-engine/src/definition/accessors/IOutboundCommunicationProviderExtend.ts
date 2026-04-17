import type { IOutboundEmailMessageProvider, IOutboundPhoneMessageProvider } from '../outboundCommunication';

export interface IOutboundCommunicationProviderExtend {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): Promise<void>;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): Promise<void>;
}
