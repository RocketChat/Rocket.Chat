import type { IOutboundProvider, ValidOutboundProvider, IOutboundMessageProviderService } from '@rocket.chat/core-typings';
import { ValidOutboundProviderList } from '@rocket.chat/core-typings';

import { getOutboundService } from '../../../../../../app/livechat/server/lib/outboundcommunication';
import { OutboundMessageProvider } from '../../../../../../server/lib/OutboundMessageProvider';

export class OutboundMessageProviderService implements IOutboundMessageProviderService {
	private readonly provider: OutboundMessageProvider;

	constructor() {
		this.provider = new OutboundMessageProvider();
	}

	get messageProvider() {
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
}

export const outboundMessageProvider = new OutboundMessageProviderService();

getOutboundService.patch(() => {
	return outboundMessageProvider;
});
