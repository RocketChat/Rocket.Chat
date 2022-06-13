import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../app/settings/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		try {
			const isEnabled = settings.get('Sentry_Integration_Enabled');
			const dsn = settings.get('Sentry_Dsn');
			if (isEnabled && dsn) {
				const tracesSampleRate = parseFloat(settings.get('Sentry_Trace_Sample_Rate'));

				Sentry.init({
					dsn,
					integrations: [new BrowserTracing()],
					// Set tracesSampleRate to 1.0 to capture 100%
					// of transactions for performance monitoring.
					// We recommend adjusting this value in production
					tracesSampleRate,
					debug: process.env.NODE_ENV === 'development',
				});
			}
		} catch (error) {}
	});
});
