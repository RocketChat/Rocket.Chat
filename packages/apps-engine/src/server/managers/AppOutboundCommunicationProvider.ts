import type { IBlock } from '@rocket.chat/ui-kit';

import type { AppAccessorManager } from '.';
import { AppMethod } from '../../definition/metadata';
import type { IOutboundMessageProviders } from '../../definition/outboundComunication';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppLogStorage } from '../storage';

export class OutboundMessageProvider {
	public isRegistered: boolean;

	constructor(
		public app: ProxiedApp,
		public provider: IOutboundMessageProviders,
	) {
		this.isRegistered = false;
	}

	// Any for now
	public async runGetProviderMetadata(logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<any> {
		return this.runTheCode(AppMethod._OUTBOUND_GET_PROVIDER_METADATA, logStorage, accessors, []);
	}

	private async runTheCode(
		method: AppMethod._OUTBOUND_GET_PROVIDER_METADATA | AppMethod._OUTBOUND_SEND_MESSAGE,
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
		runContextArgs: Array<any>,
	): Promise<string | boolean | Array<IBlock> | undefined> {
		const provider = this.provider.name;

		try {
			const result = await this.app.getDenoRuntime().sendRequest({
				method: `outboundCommunication:${provider}:${method}`,
				params: runContextArgs,
			});

			return result as any;
		} catch (e) {
			console.error(e);
		}
	}
}
