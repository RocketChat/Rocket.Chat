import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';

import OutermostErrorBoundary from './OutermostErrorBoundary';
import PageLoading from './PageLoading';
import { queryClient } from '../../lib/queryClient';

const MeteorProvider = lazy(() => import('../../providers/MeteorProvider'));
const AppLayout = lazy(() => import('./AppLayout'));

const AppRoot = (): ReactElement => (
	<OutermostErrorBoundary>
		{createPortal(
			<>
				<meta charSet='utf-8' />
				<meta httpEquiv='content-type' content='text/html; charset=utf-8' />
				<meta httpEquiv='expires' content='-1' />
				<meta httpEquiv='X-UA-Compatible' content='IE=edge' />
				<meta name='fragment' content='!' />
				<meta name='distribution' content='global' />
				<meta name='viewport' content='width=device-width, initial-scale=1, interactive-widget=resizes-content' />
				<meta name='rating' content='general' />
				<meta name='mobile-web-app-capable' content='yes' />
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta name='msapplication-TileImage' content='assets/tile_144.png' />
				<meta name='msapplication-config' content='images/browserconfig.xml' />
				<meta property='og:image' content='assets/favicon_512.png' />
				<meta property='twitter:image' content='assets/favicon_512.png' />
				<link rel='manifest' href='images/manifest.json' />
				<link rel='chrome-webstore-item' href='https://chrome.google.com/webstore/detail/nocfbnnmjnndkbipkabodnheejiegccf' />
				<link rel='mask-icon' href='assets/safari_pinned.svg' color='#04436a' />
				<link rel='apple-touch-icon' sizes='180x180' href='assets/touchicon_180.png' />
				<link rel='apple-touch-icon-precomposed' href='assets/touchicon_180_pre.png' />
			</>,
			document.head,
		)}
		<Suspense fallback={<PageLoading />}>
			<QueryClientProvider client={queryClient}>
				<MeteorProvider>
					<AppLayout />
				</MeteorProvider>
			</QueryClientProvider>
		</Suspense>
	</OutermostErrorBoundary>
);

export default AppRoot;
