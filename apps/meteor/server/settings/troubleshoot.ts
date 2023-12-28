import { settingsRegistry } from '../../app/settings/server';

export const createTroubleshootSettings = () =>
	settingsRegistry.addGroup('Troubleshoot', async function () {
		await this.add('Troubleshoot_Disable_Notifications', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Notifications_Alert',
		});

		// this settings will let clients know in case presence has been disabled
		await this.add('Presence_broadcast_disabled', false, {
			type: 'boolean',
			public: true,
			readonly: true,
		});

		await this.add('Troubleshoot_Disable_Presence_Broadcast', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Presence_Broadcast_Alert',
			enableQuery: { _id: 'Presence_broadcast_disabled', value: false },
		});

		await this.add('Troubleshoot_Disable_Instance_Broadcast', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Instance_Broadcast_Alert',
		});
		await this.add('Troubleshoot_Disable_Sessions_Monitor', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Sessions_Monitor_Alert',
		});
		await this.add('Troubleshoot_Disable_Livechat_Activity_Monitor', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Livechat_Activity_Monitor_Alert',
		});

		await this.add('Troubleshoot_Disable_Data_Exporter_Processor', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Data_Exporter_Processor_Alert',
		});
		await this.add('Troubleshoot_Disable_Teams_Mention', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Teams_Mention_Alert',
		});

		// TODO: remove this setting at next major (7.0.0)
		await this.add('Troubleshoot_Disable_Statistics_Generator', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Statistics_Generator_Alert',
			private: true,
			hidden: true,
			readonly: true,
		});
		// TODO: remove this setting at next major (7.0.0)
		await this.add('Troubleshoot_Disable_Workspace_Sync', false, {
			type: 'boolean',
			i18nDescription: 'Troubleshoot_Disable_Workspace_Sync_Alert',
			private: true,
			hidden: true,
			readonly: true,
		});

		await this.add('Troubleshoot_Force_Caching_Version', '', {
			type: 'string',
			i18nDescription: 'Troubleshoot_Force_Caching_Version_Alert',
		});
	});
