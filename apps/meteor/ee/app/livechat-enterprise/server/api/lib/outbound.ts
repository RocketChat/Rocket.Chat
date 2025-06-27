import type { IOutboundMessageProviders } from '@rocket.chat/apps-engine/definition/outboundComunication';
import type { IOutboundProvider } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

export class OutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	private isProviderValid(type?: string): type is 'phone' | 'email' {
		return type === 'phone' || type === 'email';
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
