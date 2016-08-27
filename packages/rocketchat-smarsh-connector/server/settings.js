RocketChat.settings.addGroup('Smarsh', function addSettings() {
	this.add('Smarsh_Enabled', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'Smarsh_Enabled'
	});
	this.add('Smarsh_Email', '', {
		type: 'string',
		public: true,
		i18nLabel: 'Smarsh_Email'
	});
	this.add('Smarsh_Interval', 'every_30_seconds', {
		type: 'select',
		values: [{
			key: 'every_30_seconds',
			i18nLabel: 'every_30_seconds'
		}, {
			key: 'every_30_minutes',
			i18nLabel: 'every_30_minutes'
		}, {
			key: 'every_60_minutes',
			i18nLabel: 'every_hour'
		}],
		public: true
	});
});
