import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

import pkg from '../../../package.json';

const ErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(React) || Fragment;

Bugsnag.start({
	apiKey: (window as any).__BUGSNAG_KEY__,
	appVersion: pkg.version,
	plugins: [new BugsnagPluginReact()],
});

const BugsnagErrorBoundary = ({ children }: { children: ReactElement }): ReactElement => <ErrorBoundary>{children}</ErrorBoundary>;

export default BugsnagErrorBoundary;
