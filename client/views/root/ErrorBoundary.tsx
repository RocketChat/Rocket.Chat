import React, { FC, ReactNode, Fragment, ExoticComponent, useState, useEffect } from 'react';

import pkg from '../../../package.json';

export const ErrorBoundary: FC = ({ children }) => {
	const [bugsnagkey, setKey] = useState<string | undefined>(() => (window as any).__BUGSNAG_KEY__);

	useEffect(() => {
		const handler = (): void => setKey((window as any).__BUGSNAG_KEY__);

		window.addEventListener('bugsnag-error-boundary', handler);

		return (): void => {
			window.removeEventListener('bugsnag-error-boundary', handler);
		};
	}, []);

	const [Boundary, setBoundary] = useState(() => Fragment);
	useEffect(() => {
		(async (): Promise<void> => {
			if (!bugsnagkey) {
				setBoundary(Fragment);
				return;
			}
			const Bugsnag = (await import('@bugsnag/js')).default;
			const BugsnagPluginReact = (await import('@bugsnag/plugin-react')).default;
			const ErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(React) || Fragment;

			Bugsnag.start({
				apiKey: bugsnagkey,
				appVersion: pkg.version,
				plugins: [new BugsnagPluginReact()],
			});

			setBoundary(
				ErrorBoundary as ExoticComponent<{
					children?: ReactNode;
				}>,
			);
		})();
	}, [bugsnagkey]);

	return <Boundary>{children}</Boundary>;
};
