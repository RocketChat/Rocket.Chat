import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import React, { Fragment, useEffect } from 'react';

import pkg from '../../../package.json';
import AppRoot from '../../views/root/AppRoot';

const ErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(React) || Fragment;

Bugsnag.start({
	apiKey: (window as any).__BUGSNAG_KEY__,
	appVersion: pkg.version,
	plugins: [new BugsnagPluginReact()],
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, react/display-name
export default () => {
	console.log('asd');
	useEffect(() => {
		alert('send');
		Bugsnag.notify(new Error('Test error'));
	}, []);
	return (
		<ErrorBoundary>
			<AppRoot />
		</ErrorBoundary>
	);
};
