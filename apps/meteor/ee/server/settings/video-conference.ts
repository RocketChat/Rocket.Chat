import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	settingsRegistry.addGroup('Video_Conference', function () {
		this.with(
			{
				enterprise: true,
				modules: ['videoconference-enterprise'],
			},
			function () {
				this.add('VideoConf_Disable_DMs', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				this.add('VideoConf_Disable_Channels', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				this.add('VideoConf_Disable_Groups', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				this.add('VideoConf_Disable_Teams', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});
			},
		);
	});
}
