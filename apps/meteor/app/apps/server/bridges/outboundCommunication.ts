import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type {
	IOutboundEmailMessageProvider,
	IOutboundMessageProviders,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import { OutboundMessageBridge } from '@rocket.chat/apps-engine/server/bridges';

import { getOutboundService } from '../../../livechat/server/lib/outboundcommunication';

export class OutboundCommunicationBridge extends OutboundMessageBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async registerPhoneProvider(provider: IOutboundPhoneMessageProvider, appId: string): Promise<void> {
		this.orch.debugLog(`App ${appId} is registering a phone outbound provider.`);
		getOutboundService().messageProvider.registerPhoneProvider(provider);
	}

	protected async registerEmailProvider(provider: IOutboundEmailMessageProvider, appId: string): Promise<void> {
		this.orch.debugLog(`App ${appId} is registering an email outbound provider.`);
		getOutboundService().messageProvider.registerEmailProvider(provider);
	}

	protected async unRegisterProvider(provider: IOutboundMessageProviders, appId: string): Promise<void> {
		this.orch.debugLog(`App ${appId} is unregistering an outbound provider.`);
		getOutboundService().messageProvider.unregisterProvider(appId, provider.type);
	}
}
