import type { IConfigurationExtend, IConfigurationModify, IEnvironmentRead, IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppSetting, settings } from './settings';
import { JitsiSlashCommand } from './slashCommand';
import { JitsiProvider } from './videoConfProvider';

export class JitsiApp extends App {
	private provider: JitsiProvider;

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand());

		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

		if (!this.provider) {
		    this.provider = new JitsiProvider();
		}
		await configuration.videoConfProviders.provideVideoConfProvider(this.provider);
	}

	public async onEnable(environmentRead: IEnvironmentRead, configModify: IConfigurationModify): Promise<boolean> {
		const settings = environmentRead.getSettings();

		if (!this.provider) {
		    this.provider = new JitsiProvider();
		}

		this.provider.domain = await settings.getValueById(AppSetting.JitsiDomain);
		this.provider.titlePrefix = await settings.getValueById(AppSetting.JitsiTitlePrefix);
		this.provider.titleSuffix = await settings.getValueById(AppSetting.JitsiTitleSuffix);
		this.provider.ssl = await settings.getValueById(AppSetting.JitsiSSL);
		this.provider.idType = await settings.getValueById(AppSetting.JitsiRoomIdType);
		this.provider.chromeExtensionId = await settings.getValueById(AppSetting.JitsiChromeExtension);

		return true;
	}

	public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
		switch (setting.id) {
			case AppSetting.JitsiDomain:
				this.provider.domain = setting.value;
				break;
			case AppSetting.JitsiTitlePrefix:
				this.provider.titlePrefix = setting.value;
				break;
			case AppSetting.JitsiTitleSuffix:
				this.provider.titleSuffix = setting.value;
				break;
			case AppSetting.JitsiSSL:
				this.provider.ssl = setting.value;
				break;
			case AppSetting.JitsiRoomIdType:
				this.provider.idType = setting.value;
				break;
			case AppSetting.JitsiChromeExtension:
				this.provider.chromeExtensionId = setting.value;
				break;
		}
	}
}
