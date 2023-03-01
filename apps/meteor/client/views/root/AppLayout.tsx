import type { ReactElement } from 'react';
import React, { useEffect, Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { appLayout } from '../../lib/appLayout';
import { blazePortals, useBlazePortals } from '../../lib/portals/blazePortals';
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
	useEscapeKeyStroke();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);

	const [portals] = useBlazePortals(blazePortals);

	return (
		<>
			<Suspense fallback={<PageLoading />}>{layout}</Suspense>
			{portals}
		</>
	);
};

export default AppLayout;
