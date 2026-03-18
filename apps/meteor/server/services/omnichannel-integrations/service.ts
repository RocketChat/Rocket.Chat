import { QueueWorker, ServiceClassInternal, Settings, api } from '@rocket.chat/core-services';
import type { IOmnichannelIntegrationService } from '@rocket.chat/core-services';
import type { ISMSProviderConstructor, ISMSProvider } from '@rocket.chat/core-typings';

import { registerSmsProviders } from './providers';

export class OmnichannelIntegrationService extends ServiceClassInternal implements IOmnichannelIntegrationService {
	protected name = 'omnichannel-integration';

	private smsServices: Record<string, ISMSProviderConstructor> = {};

	private readonly openClawRoutePrefix = 'openclaw.';

	private validateOpenClawTaskRoute(route: string): void {
		if (!route.startsWith(this.openClawRoutePrefix)) {
			throw new Error('error-openclaw-invalid-route');
		}
	}

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

	/**
	 * Queue OpenClaw work and return immediately.
	 * Actual routing is performed by `routeAsyncTask` through queue-worker.
	 */
	async queueAsyncTask(task: {
		provider: 'openclaw';
		route: string;
		payload: Record<string, unknown>;
		queue?: 'work' | 'workComplete';
	}): Promise<void> {
		this.validateOpenClawTaskRoute(task.route);
		await QueueWorker.queueWork(task.queue ?? 'work', `${this.name}.routeAsyncTask`, { task });
	}

	/**
	 * Dispatch a queued OpenClaw task to the configured integration action.
	 */
	async routeAsyncTask({
		task,
	}: {
		task: {
			provider: 'openclaw';
			route: string;
			payload: Record<string, unknown>;
		};
	}): Promise<void> {
		this.validateOpenClawTaskRoute(task.route);
		await api.call(task.route, [task.payload]);
	}
}
