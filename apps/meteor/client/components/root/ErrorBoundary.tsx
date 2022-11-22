import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import React, { Fragment } from 'react';

import pkg from '../../../package.json';

const ErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(React) || Fragment;

Bugsnag.start({
	apiKey: (window as any).__BUGSNAG_KEY__,
	appVersion: pkg.version,
	plugins: [new BugsnagPluginReact()],
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, react/display-name
export default ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;
