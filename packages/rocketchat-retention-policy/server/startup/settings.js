RocketChat.settings.addGroup('RetentionPolicy', function() {

	this.add('RetentionPolicy_Enabled', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_Enabled'
	});

	this.add('RetentionPolicy_MaxAge', 2592000, {
		type: 'int',
		public: true,
		i18nLabel: 'RetentionPolicy_MaxAge',
		i18nDescription: 'RetentionPolicy_MaxAge_Description'
	});

	this.add('RetentionPolicy_AppliesToChannels', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToChannels'
	});
	this.add('RetentionPolicy_AppliesToGroups', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToGroups'
	});
	this.add('RetentionPolicy_AppliesToDMs', true, {
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_AppliesToDMs'
	});

});
