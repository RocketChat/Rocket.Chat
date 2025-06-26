import type { IOutboundProvider } from '@rocket.chat/core-typings';

import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

export class OutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	public listOutboundProviders(type?: string): IOutboundMessageProviders[] {
		if (type !== undefined && !['phone', 'email'].includes(type)) {
			throw new Error('Invalid type');
		}

		return this.provider.getOutboundMessageProviders(type);
	}
}
