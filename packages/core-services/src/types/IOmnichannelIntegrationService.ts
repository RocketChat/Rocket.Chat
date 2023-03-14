import type { ISMSProviderConstructor, ISMSProvider } from '@rocket.chat/core-typings';

export type IOmnichannelIntegrationService = {
	getSmsService(name: string): Promise<ISMSProvider>;
	registerSmsService(name: string, service: ISMSProviderConstructor): void;
	isConfiguredSmsService(name: string): Promise<boolean>;
};
