import type { IOutboundProvider, IOutboundProviderMetadata, ValidOutboundProvider } from '@rocket.chat/core-typings';
import { ValidOutboundProviderList } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

export class OutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
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

	public async getProviderMetadata(id: string): Promise<IOutboundProviderMetadata> {
		const provider = this.provider.getProviderById(id);
		if (!provider) {
			throw new Error('Provider Not Found');
		}

		return provider.getProviderMetadata();
	}
}

export const outboundMessageProvider = new OutboundMessageProviderService();
