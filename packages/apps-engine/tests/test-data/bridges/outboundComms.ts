import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import { OutboundMessageBridge } from '@rocket.chat/apps-engine/server/bridges';

export class TestOutboundCommunicationBridge extends OutboundMessageBridge {
	protected async registerPhoneProvider(provider: IOutboundPhoneMessageProvider, appId: string): Promise<void> {
		return Promise.resolve();
	}

	protected async registerEmailProvider(provider: IOutboundEmailMessageProvider, appId: string): Promise<void> {
		return Promise.resolve();
	}

	protected async unRegisterProvider(provider: IOutboundMessageProviders, appId: string): Promise<void> {
		return Promise.resolve();
	}
}
