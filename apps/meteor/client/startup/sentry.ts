import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { version } from '../../../../package.json';
import { settings } from '../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		try {
			const isEnabled = settings.get('Sentry_Integration_Enabled');
			const dsn = settings.get('Sentry_Dsn');
			if (isEnabled && dsn) {
				const tracesSampleRate = parseFloat(settings.get('Sentry_Trace_Sample_Rate') || '1');

				Sentry.init({
					dsn,
					integrations: [new BrowserTracing()],
					release: version,
					environment: process.env.NODE_ENV,

					// Set tracesSampleRate to 1.0 to capture 100%
					// of transactions for performance monitoring.
					// We recommend adjusting this value in production
					tracesSampleRate,
				});
			}
		} catch (error) {
			console.log('Error initializing sentry sdk');
		}
	});
});
