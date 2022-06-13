import * as Sentry from '@sentry/node';
import { BrowserTracing } from '@sentry/tracing';

import './settings';

import { settings } from '../../../settings/server';

settings.watchMultiple(['Sentry_Integration_Enabled', 'Sentry_Dsn', 'Sentry_Trace_Sample_Rate'], (values) => {
	if (values[0] && values[1]) {
		Sentry.init({
			dsn: values[1],
			integrations: [new BrowserTracing()],
			// Set tracesSampleRate to 1.0 to capture 100%
			// of transactions for performance monitoring.
			// We recommend adjusting this value in production
			tracesSampleRate: parseFloat(values[2]),
		});
	}
});
