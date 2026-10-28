import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import EmbeddedPreload from './EmbeddedPreload';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';
import HomeSkeleton from '../../home/HomeSkeleton';

const LayoutWithSidebar = lazy(() => import('./LayoutWithSidebar'));

export type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children = null }: MainLayoutProps) => {
	useCustomScript();

	const isEmbeddedLayout = useEmbeddedLayout();
	const Layout = isEmbeddedLayout ? EmbeddedPreload : Preload;

	// The navigation chrome belongs to this layout rather than to the authentication chain, so routes that
	// only need the auth checks (the conference page) render standalone.
	return (
		<Layout>
			<AuthenticationCheck loadingElement={<HomeSkeleton />}>
				<Suspense fallback={<HomeSkeleton />}>
					<LayoutWithSidebar>
						<Suspense fallback={null}>{children}</Suspense>
					</LayoutWithSidebar>
				</Suspense>
			</AuthenticationCheck>
		</Layout>
	);
};

export default MainLayout;
