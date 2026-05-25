import { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type {
	IVideoConferenceOptions,
	IVideoConfProvider,
	VideoConfData,
	VideoConfDataExtended,
} from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConferenceUser';

import type { ProxiedApp } from '../ProxiedApp';
import type { AppAccessorManager } from './AppAccessorManager';
import { JSONRPC_METHOD_NOT_FOUND } from '../runtime/deno/AppsEngineDenoRuntime';
import type { AppLogStorage } from '../storage';

export class AppVideoConfProvider {
	/**
	 * States whether this provider has been registered into the Rocket.Chat system or not.
	 */
	public isRegistered: boolean;

	constructor(
		public app: ProxiedApp,
		public provider: IVideoConfProvider,
	) {
		this.isRegistered = false;
	}

	public hasBeenRegistered(): void {
		this.isRegistered = true;
	}

	public async runIsFullyConfigured(logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<boolean> {
		return !!(await this.runTheCode(AppMethod._VIDEOCONF_IS_CONFIGURED, logStorage, accessors, []));
	}

	public async runGenerateUrl(call: VideoConfData, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<string> {
		return (await this.runTheCode(AppMethod._VIDEOCONF_GENERATE_URL, logStorage, accessors, [call])) as string;
	}

	public async runCustomizeUrl(
		call: VideoConfDataExtended,
		user: IVideoConferenceUser | undefined,
		options: IVideoConferenceOptions = {},
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
	): Promise<string> {
		return (await this.runTheCode(AppMethod._VIDEOCONF_CUSTOMIZE_URL, logStorage, accessors, [call, user, options])) as string;
	}

	public async runOnNewVideoConference(call: VideoConference, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void> {
		await this.runTheCode(AppMethod._VIDEOCONF_NEW, logStorage, accessors, [call]);
	}

	public async runOnVideoConferenceChanged(call: VideoConference, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void> {
		await this.runTheCode(AppMethod._VIDEOCONF_CHANGED, logStorage, accessors, [call]);
	}

	public async runOnUserJoin(
		call: VideoConference,
		user: IVideoConferenceUser | undefined,
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
	): Promise<void> {
		await this.runTheCode(AppMethod._VIDEOCONF_USER_JOINED, logStorage, accessors, [call, user]);
	}

	public async runGetVideoConferenceInfo(
		call: VideoConference,
		user: IVideoConferenceUser | undefined,
		logStorage: AppLogStorage,
		accessors: AppAccessorManager,
	): Promise<Array<IBlock> | undefined> {
		return (await this.runTheCode(AppMethod._VIDEOCONF_GET_INFO, logStorage, accessors, [call, user])) as Array<IBlock> | undefined;
	}

	private async runTheCode(
		method:
			| AppMethod._VIDEOCONF_GENERATE_URL
			| AppMethod._VIDEOCONF_CUSTOMIZE_URL
			| AppMethod._VIDEOCONF_IS_CONFIGURED
			| AppMethod._VIDEOCONF_NEW
			| AppMethod._VIDEOCONF_CHANGED
			| AppMethod._VIDEOCONF_GET_INFO
			| AppMethod._VIDEOCONF_USER_JOINED,
		_logStorage: AppLogStorage,
		_accessors: AppAccessorManager,
		runContextArgs: Array<any>,
	): Promise<string | boolean | Array<IBlock> | undefined> {
		const provider = this.provider.name;

		try {
			const result = await this.app.getRuntimeController().sendRequest({
				method: `videoconference:${provider}:${method}`,
				params: runContextArgs,
			});

			return result as string | boolean | Array<IBlock> | undefined;
		} catch (e) {
			if (e?.code === JSONRPC_METHOD_NOT_FOUND) {
				if (method === AppMethod._VIDEOCONF_IS_CONFIGURED) {
					return true;
				}
				if (![AppMethod._VIDEOCONF_GENERATE_URL, AppMethod._VIDEOCONF_CUSTOMIZE_URL].includes(method)) {
					return undefined;
				}
			}

			// @TODO add error handling
			console.log(e);
		}
	}
}
