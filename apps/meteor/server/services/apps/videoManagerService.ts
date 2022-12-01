import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { VideoConfData, VideoConfDataExtended, IVideoConferenceOptions } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps-engine/server/managers';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';

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
		if (!this.apps.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

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

	async onUserJoin(providerName: string, call: VideoConference, user?: IVideoConferenceUser | undefined): Promise<void> {
		this.getVideoConfProviderManager().onUserJoin(providerName, call, user);
	}

	async onNewVideoConference(providerName: string, call: VideoConference): Promise<void> {
		this.getVideoConfProviderManager().onNewVideoConference(providerName, call);
	}

	async onVideoConferenceChanged(providerName: string, call: VideoConference): Promise<void> {
		this.getVideoConfProviderManager().onVideoConferenceChanged(providerName, call);
	}

	async getVideoConferenceInfo(
		providerName: string,
		call: VideoConference,
		user?: IVideoConferenceUser | undefined,
	): Promise<IBlock[] | undefined> {
		return this.getVideoConfProviderManager().getVideoConferenceInfo(providerName, call, user);
	}
}
