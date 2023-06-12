import type { ReactElement } from 'react';
import React, { useEffect, Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useAnalytics } from '../../../app/analytics/client/loadScript';
import { appLayout } from '../../lib/appLayout';
import PageLoading from './PageLoading';
import { useEscapeKeyStroke } from './hooks/useEscapeKeyStroke';
import { useGoogleTagManager } from './hooks/useGoogleTagManager';
import { useMessageLinkClicks } from './hooks/useMessageLinkClicks';

const AppLayout = (): ReactElement => {
	useEffect(() => {
		document.body.classList.add('color-primary-font-color', 'rcx-content--main');

		return () => {
			document.body.classList.add('color-primary-font-color', 'rcx-content--main');
		};
	}, []);

	useMessageLinkClicks();
	useGoogleTagManager();
	useAnalytics();
	useEscapeKeyStroke();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	return <Suspense fallback={<PageLoading />}>{layout}</Suspense>;
};

export default AppLayout;
