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
		try {
			this.orch.debugLog(`App ${appId} is registering a phone outbound provider.`);
			getOutboundService().messageProvider.registerPhoneProvider(provider);
		} catch (err) {
			this.orch.getRocketChatLogger().error({ appId, err, msg: 'Failed to register phone provider' });
			throw new Error('error-registering-provider');
		}
	}

	protected async registerEmailProvider(provider: IOutboundEmailMessageProvider, appId: string): Promise<void> {
		try {
			this.orch.debugLog(`App ${appId} is registering an email outbound provider.`);
			getOutboundService().messageProvider.registerEmailProvider(provider);
		} catch (err) {
			this.orch.getRocketChatLogger().error({ appId, err, msg: 'Failed to register email provider' });
			throw new Error('error-registering-provider');
		}
	}

	protected async unRegisterProvider(provider: IOutboundMessageProviders, appId: string): Promise<void> {
		try {
			this.orch.debugLog(`App ${appId} is unregistering an outbound provider.`);
			getOutboundService().messageProvider.unregisterProvider(appId, provider.type);
		} catch (err) {
			this.orch.getRocketChatLogger().error({ appId, err, msg: 'Failed to unregister provider' });
			throw new Error('error-unregistering-provider');
		}
	}
}
