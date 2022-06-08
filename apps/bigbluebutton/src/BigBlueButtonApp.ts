import type {
	IAppAccessors,
	IConfigurationExtend,
	IConfigurationModify,
	IEnvironmentRead,
	IHttp,
	ILogger,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppSetting, settings } from './settings';
import { BBBProvider } from './videoConfProvider';

export class BigBlueButtonApp extends App {
	private provider: BBBProvider | undefined;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

		const provider = this.getProvider();
		await configuration.videoConfProviders.provideVideoConfProvider(provider);
	}

	public async onEnable(environmentRead: IEnvironmentRead, configModify: IConfigurationModify): Promise<boolean> {
		const settings = environmentRead.getSettings();

		const provider = this.getProvider();

		provider.url = await settings.getValueById(AppSetting.Url);
		provider.secret = await settings.getValueById(AppSetting.Secret);

		return true;
	}

	public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
		const provider = this.getProvider();

		switch (setting.id) {
			case AppSetting.Url:
				provider.url = setting.value;
				break;
			case AppSetting.Secret:
				provider.secret = setting.value;
				break;
		}
	}

	private getProvider(): BBBProvider {
		if (!this.provider) {
			this.provider = new BBBProvider(this);
		}

		return this.provider;
	}
}
