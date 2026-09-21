import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import EmbeddedPreload from './EmbeddedPreload';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';
import HomeSkeleton from '../../home/HomeSkeleton';

export type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children = null }: MainLayoutProps) => {
	useCustomScript();

	const isEmbeddedLayout = useEmbeddedLayout();

	if (isEmbeddedLayout) {
		return (
			<EmbeddedPreload>
				<AuthenticationCheck loadingElement={<HomeSkeleton />}>
					<Suspense fallback={null}>{children}</Suspense>
				</AuthenticationCheck>
			</EmbeddedPreload>
		);
	}

	return (
		<Preload>
			<AuthenticationCheck loadingElement={<HomeSkeleton />}>
				<Suspense fallback={null}>{children}</Suspense>
			</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
