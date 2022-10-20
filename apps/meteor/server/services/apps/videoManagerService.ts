import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { VideoConfData, VideoConfDataExtended, IVideoConferenceOptions } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps-engine/server/managers';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';
import type { IAppsVideoManagerService } from '../../sdk/types/IAppsVideoManagerService';

export class AppsVideoManagerService extends ServiceClass implements IAppsVideoManagerService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	constructor() {
		super();
		this.apps = OrchestratorFactory.getOrchestrator();
	}

	private getVideoConfProviderManager(): AppVideoConfProviderManager {
		const manager = this.apps.getManager()?.getVideoConfProviderManager();
		if (!manager) {
			throw new Error('no-videoconf-provider-app');
		}

		return manager;
	}

	async isFullyConfigured(providerName: string): Promise<boolean> {
		return this.getVideoConfProviderManager().isFullyConfigured(providerName);
	}

	async generateUrl(providerName: string, call: VideoConfData): Promise<string> {
		return this.getVideoConfProviderManager().generateUrl(providerName, call);
	}

	async customizeUrl(
		providerName: string,
		call: VideoConfDataExtended,
		user?: IVideoConferenceUser | undefined,
		options?: IVideoConferenceOptions | undefined,
	): Promise<string> {
		return this.getVideoConfProviderManager().customizeUrl(providerName, call, user, options);
	}
}
