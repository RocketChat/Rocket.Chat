import { settingsRegistry } from '../../app/settings/server';

const THIRTY_DAYS = 2592000000;

export const createRetentionSettings = () =>
	settingsRegistry.addGroup('RetentionPolicy', async function () {
		const globalQuery = {
			_id: 'RetentionPolicy_Enabled',
			value: true,
		};

		await this.add('RetentionPolicy_Enabled', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_Enabled',
			alert:
				'Watch out! Tweaking these settings without utmost care can destroy all message history. Please read <a href="https://docs.rocket.chat/use-rocket.chat/workspace-administration/settings/retention-policies" target="_blank">here</a> the documentation before turning the feature ON.',
		});

		await this.add('RetentionPolicy_Precision', '0', {
			type: 'select',
			values: [
				{
					key: '0',
					i18nLabel: 'every_30_minutes',
				},
				{
					key: '1',
					i18nLabel: 'every_hour',
				},
				{
					key: '2',
					i18nLabel: 'every_six_hours',
				},
				{
					key: '3',
					i18nLabel: 'every_day',
				},
			],
			public: true,
			i18nLabel: 'RetentionPolicy_Precision',
			i18nDescription: 'RetentionPolicy_Precision_Description',
			enableQuery: [
				globalQuery,
				{
					_id: 'RetentionPolicy_Advanced_Precision',
					value: false,
				},
			],
		});

		await this.add('RetentionPolicy_Advanced_Precision', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_Advanced_Precision',
			i18nDescription: 'RetentionPolicy_Advanced_Precision_Description',
			enableQuery: globalQuery,
		});

		await this.add('RetentionPolicy_Advanced_Precision_Cron', '*/30 * * * *', {
			type: 'string',
			public: true,
			i18nLabel: 'RetentionPolicy_Advanced_Precision_Cron',
			i18nDescription: 'RetentionPolicy_Advanced_Precision_Cron_Description',
			enableQuery: [globalQuery, { _id: 'RetentionPolicy_Advanced_Precision', value: true }],
		});

		await this.section('Global Policy', async function () {
			await this.add('RetentionPolicy_AppliesToChannels', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_AppliesToChannels',
				i18nDescription: 'RetentionPolicy_AppliesToChannels_Description',
				enableQuery: globalQuery,
			});
			await this.add('RetentionPolicy_MaxAge_Channels', 30, {
				type: 'int',
				public: true,
				hidden: true,
				i18nLabel: 'RetentionPolicy_MaxAge_Channels',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToChannels',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_TTL_Channels', THIRTY_DAYS, {
				type: 'timespan',
				public: true,
				i18nLabel: 'RetentionPolicy_TTL_Channels',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToChannels',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_AppliesToGroups', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_AppliesToGroups',
				i18nDescription: 'RetentionPolicy_AppliesToGroups_Description',
				enableQuery: globalQuery,
			});
			await this.add('RetentionPolicy_MaxAge_Groups', 30, {
				type: 'int',
				public: true,
				hidden: true,
				i18nLabel: 'RetentionPolicy_MaxAge_Groups',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToGroups',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_TTL_Groups', THIRTY_DAYS, {
				type: 'timespan',
				public: true,
				i18nLabel: 'RetentionPolicy_TTL_Groups',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToGroups',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_AppliesToDMs', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_AppliesToDMs',
				enableQuery: globalQuery,
			});

			await this.add('RetentionPolicy_MaxAge_DMs', 30, {
				type: 'int',
				public: true,
				hidden: true,
				i18nLabel: 'RetentionPolicy_MaxAge_DMs',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToDMs',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_TTL_DMs', THIRTY_DAYS, {
				type: 'timespan',
				public: true,
				i18nLabel: 'RetentionPolicy_TTL_DMs',
				enableQuery: [
					{
						_id: 'RetentionPolicy_AppliesToDMs',
						value: true,
					},
					globalQuery,
				],
			});

			await this.add('RetentionPolicy_DoNotPrunePinned', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_DoNotPrunePinned',
				enableQuery: globalQuery,
			});

			await this.add('RetentionPolicy_FilesOnly', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_FilesOnly',
				i18nDescription: 'RetentionPolicy_FilesOnly_Description',
				enableQuery: globalQuery,
			});
			await this.add('RetentionPolicy_DoNotPruneDiscussion', true, {
				group: 'RetentionPolicy',
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_DoNotPruneDiscussion',
				i18nDescription: 'RetentionPolicy_DoNotPruneDiscussion_Description',
				enableQuery: globalQuery,
			});
			await this.add('RetentionPolicy_DoNotPruneThreads', true, {
				group: 'RetentionPolicy',
				type: 'boolean',
				public: true,
				i18nLabel: 'RetentionPolicy_DoNotPruneThreads',
				i18nDescription: 'RetentionPolicy_DoNotPruneThreads_Description',
				enableQuery: globalQuery,
			});
		});
	});
