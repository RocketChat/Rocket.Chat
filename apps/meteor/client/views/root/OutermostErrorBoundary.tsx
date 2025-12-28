import Bugsnag from '@bugsnag/js';
import type { BugsnagErrorBoundary as BugsnagErrorBoundaryComponent } from '@bugsnag/plugin-react';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import type { ReactNode } from 'react';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import AppErrorPage from './AppErrorPage';
import { Info } from '../../../app/utils/rocketchat.info';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		__BUGSNAG_KEY__: string;
	}
}

let BugsnagErrorBoundary: BugsnagErrorBoundaryComponent | undefined;

if (window.__BUGSNAG_KEY__) {
	Bugsnag.start({
		apiKey: window.__BUGSNAG_KEY__,
		appVersion: Info.version,
		plugins: [new BugsnagPluginReact()],
	});

	BugsnagErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(React);
}

type OutermostErrorBoundaryProps = {
	children: ReactNode;
};

const OutermostErrorBoundary = ({ children }: OutermostErrorBoundaryProps) => {
	if (BugsnagErrorBoundary) {
		return <BugsnagErrorBoundary FallbackComponent={AppErrorPage}>{children}</BugsnagErrorBoundary>;
	}

	return (
		<ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => <AppErrorPage error={error} clearError={resetErrorBoundary} />}>
			{children}
		</ErrorBoundary>
	);
};

export default OutermostErrorBoundary;
