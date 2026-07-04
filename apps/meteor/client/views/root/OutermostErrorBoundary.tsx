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
		onError(event) {
			// Skip the benign "ResizeObserver loop" browser warning (not a crash; emitted in bulk by
			// virtua during message-list scroll). See CORE-2209.
			const errorMessage = event.errors?.[0]?.errorMessage;
			if (typeof errorMessage === 'string' && errorMessage.startsWith('ResizeObserver loop')) {
				return false;
			}
		},
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

	return <ErrorBoundary fallbackRender={() => <AppErrorPage />}>{children}</ErrorBoundary>;
};

export default OutermostErrorBoundary;
