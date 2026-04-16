import type { AppAccessorManager } from '.';
import { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import type { IOutboundMessage, IOutboundMessageProviders, ProviderMetadata } from '@rocket.chat/apps-engine/definition/outboundCommunication';
import type { ProxiedApp } from '../ProxiedApp';
import { AppOutboundProcessError } from '../errors/AppOutboundProcessError';
import type { AppLogStorage } from '../storage';

export class OutboundMessageProvider {
	public isRegistered: boolean;

	constructor(
		public app: ProxiedApp,
		public provider: IOutboundMessageProviders,
	) {
		this.isRegistered = false;
	}

	public async runGetProviderMetadata(_logStorage: AppLogStorage, _accessors: AppAccessorManager): Promise<ProviderMetadata> {
		return this.runTheCode<ProviderMetadata>(AppMethod._OUTBOUND_GET_PROVIDER_METADATA, _logStorage, _accessors, []);
	}

	public async runSendOutboundMessage(_logStorage: AppLogStorage, _accessors: AppAccessorManager, body: IOutboundMessage): Promise<void> {
		await this.runTheCode(AppMethod._OUTBOUND_SEND_MESSAGE, _logStorage, _accessors, [body]);
	}

	private async runTheCode<T = unknown>(
		method: AppMethod._OUTBOUND_GET_PROVIDER_METADATA | AppMethod._OUTBOUND_SEND_MESSAGE,
		_logStorage: AppLogStorage,
		_accessors: AppAccessorManager,
		runContextArgs: Array<any>,
	): Promise<T> {
		const provider = `${this.provider.name}-${this.provider.type}`;

		try {
			const result = await this.app.getRuntimeController().sendRequest({
				method: `outboundCommunication:${provider}:${method}`,
				params: runContextArgs,
			});

			return result as T;
		} catch (e) {
			const err = e as { message?: string };
			if (err.message === 'error-invalid-provider') {
				throw new Error('error-provider-not-registered');
			}
			throw new AppOutboundProcessError(err.message ?? String(e), method);
		}
	}

	public setRegistered(registered: boolean): void {
		this.isRegistered = registered;
	}
}
