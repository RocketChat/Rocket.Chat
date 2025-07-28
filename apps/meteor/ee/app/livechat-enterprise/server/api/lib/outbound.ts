import { Apps } from '@rocket.chat/apps';
import type {
	IOutboundProvider,
	ValidOutboundProvider,
	IOutboundMessageProviderService,
	IOutboundProviderMetadata,
	IOutboundMessage,
} from '@rocket.chat/core-typings';
import { ValidOutboundProviderList } from '@rocket.chat/core-typings';

import { getOutboundService } from '../../../../../../app/livechat/server/lib/outboundcommunication';
import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

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

		return this.getProviderManager().getProviderMetadata(provider.appId, provider.type);
	}

	private getProviderManager() {
		if (!Apps.self?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = Apps.self?.getManager()?.getOutboundCommunicationProviderManager();
		if (!manager) {
			throw new Error('apps-engine-not-configured-correctly');
		}

		return manager;
	}

	public sendMessage(
		providerId: string,
		{
			to,
			type,
			templateProviderPhoneNumber,
			template,
		}: {
			to: string;
			type: ValidOutboundProvider;
			templateProviderPhoneNumber: string;
			template: IOutboundMessage;
		},
	) {
		const provider = this.provider.findOneByProviderId(providerId);
		if (!provider) {
			throw new Error('error-invalid-provider');
		}

		if (provider.type !== type) {
			throw new Error('error-invalid-provider-type');
		}

		return this.getProviderManager().sendOutboundMessage(provider.appId, provider.type, { to, templateProviderPhoneNumber, template });
	}
}

export const outboundMessageProvider = new OutboundMessageProviderService();

getOutboundService.patch(() => {
	return outboundMessageProvider;
});
