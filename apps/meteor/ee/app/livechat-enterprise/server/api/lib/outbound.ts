import type {
	IOutboundMessageProviders,
	ProviderType as ValidProviderTypes,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import type { IOutboundProvider } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

const PROVIDER_TYPES = ['phone', 'email'] as const;

export class OutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	private isProviderValid(type?: string): type is ValidProviderTypes {
		return PROVIDER_TYPES.includes(type as ValidProviderTypes);
	}

	public listOutboundProviders(type?: string): IOutboundProvider[] {
		if (type !== undefined && !this.isProviderValid(type)) {
			throw new Error('Invalid type');
		}

		const providers = this.provider.getOutboundMessageProviders(type);

		return providers.map<IOutboundProvider>((provider: IOutboundMessageProviders) => {
			return {
				providerId: provider.appId,
				providerName: provider.name,
				supportsTemplates: true,
				providerType: provider.type,
			};
		});
	}
}
