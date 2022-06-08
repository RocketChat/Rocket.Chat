import type { IConfigurationExtend, IConfigurationModify, IEnvironmentRead, IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppSetting, settings } from './settings';
import { JitsiSlashCommand } from './slashCommand';
import { JitsiProvider } from './videoConfProvider';

export class JitsiApp extends App {
	private provider: JitsiProvider | undefined;

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.slashCommands.provideSlashCommand(new JitsiSlashCommand());

		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));

		const provider = this.getProvider();
		await configuration.videoConfProviders.provideVideoConfProvider(provider);
	}

	public async onEnable(environmentRead: IEnvironmentRead, configModify: IConfigurationModify): Promise<boolean> {
		const settings = environmentRead.getSettings();

		const provider = this.getProvider();

		provider.domain = await settings.getValueById(AppSetting.JitsiDomain);
		provider.titlePrefix = await settings.getValueById(AppSetting.JitsiTitlePrefix);
		provider.titleSuffix = await settings.getValueById(AppSetting.JitsiTitleSuffix);
		provider.ssl = await settings.getValueById(AppSetting.JitsiSSL);
		provider.idType = await settings.getValueById(AppSetting.JitsiRoomIdType);
		provider.chromeExtensionId = await settings.getValueById(AppSetting.JitsiChromeExtension);

		return true;
	}

	public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
		const provider = this.getProvider();

		switch (setting.id) {
			case AppSetting.JitsiDomain:
				provider.domain = setting.value;
				break;
			case AppSetting.JitsiTitlePrefix:
				provider.titlePrefix = setting.value;
				break;
			case AppSetting.JitsiTitleSuffix:
				provider.titleSuffix = setting.value;
				break;
			case AppSetting.JitsiSSL:
				provider.ssl = setting.value;
				break;
			case AppSetting.JitsiRoomIdType:
				provider.idType = setting.value;
				break;
			case AppSetting.JitsiChromeExtension:
				provider.chromeExtensionId = setting.value;
				break;
		}
	}

	private getProvider(): JitsiProvider {
		if (!this.provider) {
			this.provider = new JitsiProvider();
		}

		return this.provider;
	}
}
