import type { IOutboundEmailMessageProvider, IOutboundPhoneMessageProvider } from '../outboundCommunication';

/**
 * Registers the outbound message providers an App offers the workspace.
 *
 * Call this from the App's `extendConfiguration`; it needs the
 * `outbound-communication.provide` permission.
 */
export interface IOutboundCommunicationProviderExtend {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): Promise<void>;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): Promise<void>;
}
