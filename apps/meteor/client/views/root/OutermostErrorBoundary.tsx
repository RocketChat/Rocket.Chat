import type { BugsnagErrorBoundary as BugsnagErrorBoundaryComponent } from '@bugsnag/plugin-react';
import type { ReactNode } from 'react';
import React, { lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Info } from '../../../app/utils/rocketchat.info';
import AppErrorPage from './AppErrorPage';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		__BUGSNAG_KEY__: string;
	}
}

const BugsnagErrorBoundary = lazy(async () => {
	const { default: Bugsnag } = await import('@bugsnag/js');
	const { default: BugsnagPluginReact } = await import('@bugsnag/plugin-react');
	Bugsnag.start({
		apiKey: window.__BUGSNAG_KEY__,
		appVersion: Info.version,
		plugins: [new BugsnagPluginReact()],
	});
	return {
		default: Bugsnag.getPlugin('react')?.createErrorBoundary(React) as BugsnagErrorBoundaryComponent,
	};
});

type OutermostErrorBoundaryProps = {
	children: ReactNode;
};

const OutermostErrorBoundary = ({ children }: OutermostErrorBoundaryProps) => {
	if (window.__BUGSNAG_KEY__) {
		return <BugsnagErrorBoundary FallbackComponent={AppErrorPage}>{children}</BugsnagErrorBoundary>;
	}

	return (
		<ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => <AppErrorPage error={error} clearError={resetErrorBoundary} />}>
			{children}
		</ErrorBoundary>
	);
};

export default OutermostErrorBoundary;
