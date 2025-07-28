import type { AppAccessorManager } from '.';
import { AppMethod } from '../../definition/metadata';
import type { IOutboundMessage, IOutboundMessageProviders, ProviderMetadata } from '../../definition/outboundComunication';
import { AppOutboundProcessError } from '../errors/AppOutboundProcessError';
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

	public async runGetProviderMetadata(logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<ProviderMetadata> {
		return this.runTheCode<ProviderMetadata>(AppMethod._OUTBOUND_GET_PROVIDER_METADATA, logStorage, accessors, []);
	}

	public async runSendOutboundMessage(
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
		body: {
			to: string;
			templateProviderPhoneNumber: string;
			template: IOutboundMessage;
		},
	): Promise<void> {
		await this.runTheCode(AppMethod._OUTBOUND_SEND_MESSAGE, logStorage, accessors, [body]);
	}

	private async runTheCode<T = unknown>(
		method: AppMethod._OUTBOUND_GET_PROVIDER_METADATA | AppMethod._OUTBOUND_SEND_MESSAGE,
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
		runContextArgs: Array<any>,
	): Promise<T> {
		const provider = `${this.provider.name}-${this.provider.type}`;

		try {
			const result = await this.app.getDenoRuntime().sendRequest({
				method: `outboundCommunication:${provider}:${method}`,
				params: runContextArgs,
			});

			return result as T;
		} catch (e) {
			if (e?.message === 'error-invalid-provider') {
				throw new Error('error-provider-not-registered');
			}
			throw new AppOutboundProcessError(e.message, method);
		}
	}
}
