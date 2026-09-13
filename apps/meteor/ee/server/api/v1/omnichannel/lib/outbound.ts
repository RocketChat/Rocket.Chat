import { Apps } from '@rocket.chat/apps';
import type {
	IOutboundProvider,
	ValidOutboundProvider,
	IOutboundMessageProviderService,
	IOutboundProviderMetadata,
	IOutboundMessage,
} from '@rocket.chat/core-typings';
import { ValidOutboundProviderList } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';
import { getOutboundService } from '../../../../../../server/lib/omnichannel/outboundcommunication';

export class OutboundMessageProviderService implements IOutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	get outboundMessageProvider() {
		return this.provider;
	}

	private isProviderValid(type: any): type is ValidOutboundProvider {
		return ValidOutboundProviderList.includes(type);
	}

	public listOutboundProviders(type?: string): IOutboundProvider[] {
		if (type !== undefined && !this.isProviderValid(type)) {
			throw new Error('Invalid type');
		}

		return this.provider.getOutboundMessageProviders(type);
	}

	public getProviderMetadata(providerId: string): Promise<IOutboundProviderMetadata> {
		const provider = this.provider.findOneByProviderId(providerId);
		if (!provider) {
			throw new Error('error-invalid-provider');
		}

		return Apps.outboundProviders.getProviderMetadata(provider.appId, provider.type);
	}

	public sendMessage(providerId: string, message: IOutboundMessage) {
		const provider = this.provider.findOneByProviderId(providerId);
		if (!provider) {
			throw new Error('error-invalid-provider');
		}

		return Apps.outboundProviders.sendOutboundMessage(provider.appId, provider.type, message);
	}
}

export const outboundMessageProvider = new OutboundMessageProviderService();

getOutboundService.patch(() => {
	return outboundMessageProvider;
});
