import type { ISMSProviderConstructor, ISMSProvider } from '@rocket.chat/core-typings';

export type OpenClawAsyncTask = {
	provider: 'openclaw';
	route: string;
	payload: Record<string, unknown>;
	queue?: 'work' | 'workComplete';
};

export type IOmnichannelIntegrationService = {
	getSmsService(name: string): Promise<ISMSProvider>;
	registerSmsService(name: string, service: ISMSProviderConstructor): void;
	isConfiguredSmsService(name: string): Promise<boolean>;
	queueAsyncTask(task: OpenClawAsyncTask): Promise<void>;
	routeAsyncTask(params: { task: OpenClawAsyncTask }): Promise<void>;
};
