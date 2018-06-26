RocketChat.settings.addGroup('RetentionPolicy', function() {

	this.add('RetentionPolicy_Enabled', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_Enabled'
	});

	this.add('RetentionPolicy_AppliesToChannels', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToChannels'
	});
	this.add('RetentionPolicy_MaxAge_Channels', 2592000, {
		type: 'int',
		public: true,
		i18nLabel: 'RetentionPolicy_MaxAge_Channels',
		i18nDescription: 'RetentionPolicy_MaxAge_Description'
	});

	this.add('RetentionPolicy_AppliesToGroups', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToGroups'
	});
	this.add('RetentionPolicy_MaxAge_Groups', 2592000, {
		type: 'int',
		public: true,
		i18nLabel: 'RetentionPolicy_MaxAge_Groups',
		i18nDescription: 'RetentionPolicy_MaxAge_Description'
	});

	this.add('RetentionPolicy_AppliesToDMs', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToDMs'
	});
	this.add('RetentionPolicy_MaxAge_DMs', 2592000, {
		type: 'int',
		public: true,
		i18nLabel: 'RetentionPolicy_MaxAge_DMs',
		i18nDescription: 'RetentionPolicy_MaxAge_Description'
	});

	this.add('RetentionPolicy_ExcludePinned', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_ExcludePinned'
	});
	this.add('RetentionPolicy_FilesOnly', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_FilesOnly',
		i18nDescription: 'RetentionPolicy_FilesOnly_Description'
	});
});
