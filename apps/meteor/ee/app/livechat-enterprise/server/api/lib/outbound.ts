import { ProviderTypeEnum } from '@rocket.chat/core-typings';
import type { IOutboundProvider, OutboundProviderTypes as ValidProviderTypes } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

export class OutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	private isProviderValid(type?: string): type is ValidProviderTypes {
		return !!type && type in ProviderTypeEnum;
	}

	public listOutboundProviders(type?: string): IOutboundProvider[] {
		if (type !== undefined && !this.isProviderValid(type)) {
			throw new Error('Invalid type');
		}

		return this.provider.getOutboundMessageProviders(type);
	}
}

export const outboundMessageProvider = new OutboundMessageProviderService();
