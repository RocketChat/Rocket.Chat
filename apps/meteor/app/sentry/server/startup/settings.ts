import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('Sentry', function () {
	this.add('Sentry_Integration_Enabled', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'Sentry',
		alert: 'This feature may require restart server to take effect.',
	});

	this.add('Sentry_Dsn', '', {
		type: 'string',
		i18nLabel: 'Sentry_Dsn',
		enableQuery: {
			_id: 'Sentry_Integration_Enabled',
			value: true,
		},
		public: true,
	});

	this.add('Sentry_Trace_Sample_Rate', 1, {
		type: 'select',
		values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
			key: (i / 10).toString(),
			i18nLabel: (i / 10).toString(),
		})),
		enableQuery: {
			_id: 'Sentry_Integration_Enabled',
			value: true,
		},
		i18nLabel: 'Sentry_Trace_Sample_Rate',
        i18nDescription: 'Sentry_Trace_Sample_Rate_Description',
	});
});
