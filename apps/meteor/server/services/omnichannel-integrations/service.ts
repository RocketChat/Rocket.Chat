import { ServiceClassInternal, Settings } from '@rocket.chat/core-services';
import type { IOmnichannelIntegrationService } from '@rocket.chat/core-services';
import type { ISMSProviderConstructor, ISMSProvider } from '@rocket.chat/core-typings';

import { registerSmsProviders } from './providers';

export class OmnichannelIntegrationService extends ServiceClassInternal implements IOmnichannelIntegrationService {
	protected name = 'omnichannel-integration';

	private smsServices: Record<string, ISMSProviderConstructor> = {};

	registerSmsService(name: string, service: ISMSProviderConstructor) {
		this.smsServices[name] = service;
	}

	constructor() {
		super();

		registerSmsProviders(this.registerSmsService.bind(this));
	}

	async getSmsService(name: string): Promise<ISMSProvider> {
		if (!(await Settings.get<boolean>('SMS_Enabled'))) {
			throw new Error('error-sms-service-disabled');
		}
		if (!this.smsServices[name.toLowerCase()]) {
			throw new Error('error-sms-service-not-configured');
		}

		return new this.smsServices[name.toLowerCase()]();
	}

	async isConfiguredSmsService(name: string): Promise<boolean> {
		return name.toLowerCase() === (await Settings.get<string>('SMS_Service'));
	}
}
