import { settingsRegistry } from '../../app/settings/server';

export const createWebRTCSettings = () =>
	settingsRegistry.addGroup('WebRTC', async function () {
		await this.add('WebRTC_Enabled', false, {
			type: 'boolean',
			group: 'WebRTC',
			public: true,
			i18nLabel: 'Enabled',
		});
		await this.add('WebRTC_Enable_Channel', false, {
			type: 'boolean',
			group: 'WebRTC',
			public: true,
			enableQuery: { _id: 'WebRTC_Enabled', value: true },
		});
		await this.add('WebRTC_Enable_Private', false, {
			type: 'boolean',
			group: 'WebRTC',
			public: true,
			enableQuery: { _id: 'WebRTC_Enabled', value: true },
		});
		await this.add('WebRTC_Enable_Direct', false, {
			type: 'boolean',
			group: 'WebRTC',
			public: true,
			enableQuery: { _id: 'WebRTC_Enabled', value: true },
		});
		await this.add('WebRTC_Calls_Count', 0, {
			type: 'int',
			hidden: true,
		});
		return this.add(
			'WebRTC_Servers',
			'stun:stun.l.google.com:19302, stun:23.21.150.121, team%40rocket.chat:demo@turn:numb.viagenie.ca:3478',
			{
				type: 'string',
				group: 'WebRTC',
				public: true,
				enableQuery: { _id: 'WebRTC_Enabled', value: true },
			},
		);
	});
