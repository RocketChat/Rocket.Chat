import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('RetentionPolicy', function () {
	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	this.add('RetentionPolicy_Enabled', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_Enabled',
		alert:
			'Watch out! Tweaking these settings without utmost care can destroy all message history. Please read the documentation before turning the feature on at rocket.chat/docs/administrator-guides/retention-policies/',
	});

	this.add('RetentionPolicy_Precision', '0', {
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

	this.add('RetentionPolicy_Advanced_Precision', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_Advanced_Precision',
		i18nDescription: 'RetentionPolicy_Advanced_Precision_Description',
		enableQuery: globalQuery,
	});

	this.add('RetentionPolicy_Advanced_Precision_Cron', '*/30 * * * *', {
		type: 'string',
		public: true,
		i18nLabel: 'RetentionPolicy_Advanced_Precision_Cron',
		i18nDescription: 'RetentionPolicy_Advanced_Precision_Cron_Description',
		enableQuery: [globalQuery, { _id: 'RetentionPolicy_Advanced_Precision', value: true }],
	});

	this.section('Global Policy', function () {
		this.add('RetentionPolicy_AppliesToChannels', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_AppliesToChannels',
			enableQuery: globalQuery,
		});
		this.add('RetentionPolicy_MaxAge_Channels', 30, {
			type: 'int',
			public: true,
			i18nLabel: 'RetentionPolicy_MaxAge_Channels',
			i18nDescription: 'RetentionPolicy_MaxAge_Description',
			enableQuery: [
				{
					_id: 'RetentionPolicy_AppliesToChannels',
					value: true,
				},
				globalQuery,
			],
		});

		this.add('RetentionPolicy_AppliesToGroups', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_AppliesToGroups',
			enableQuery: globalQuery,
		});
		this.add('RetentionPolicy_MaxAge_Groups', 30, {
			type: 'int',
			public: true,
			i18nLabel: 'RetentionPolicy_MaxAge_Groups',
			i18nDescription: 'RetentionPolicy_MaxAge_Description',
			enableQuery: [
				{
					_id: 'RetentionPolicy_AppliesToGroups',
					value: true,
				},
				globalQuery,
			],
		});

		this.add('RetentionPolicy_AppliesToDMs', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_AppliesToDMs',
			enableQuery: globalQuery,
		});

		this.add('RetentionPolicy_MaxAge_DMs', 30, {
			type: 'int',
			public: true,
			i18nLabel: 'RetentionPolicy_MaxAge_DMs',
			i18nDescription: 'RetentionPolicy_MaxAge_Description',
			enableQuery: [
				{
					_id: 'RetentionPolicy_AppliesToDMs',
					value: true,
				},
				globalQuery,
			],
		});

		this.add('RetentionPolicy_DoNotPrunePinned', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_DoNotPrunePinned',
			enableQuery: globalQuery,
		});

		this.add('RetentionPolicy_FilesOnly', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'RetentionPolicy_FilesOnly',
			i18nDescription: 'RetentionPolicy_FilesOnly_Description',
			enableQuery: globalQuery,
		});
	});
});
