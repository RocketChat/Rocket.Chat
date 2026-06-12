import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import EmbeddedPreload from './EmbeddedPreload';
import LayoutWithSidebar from './LayoutWithSidebar';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';

type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children = null }: MainLayoutProps) => {
	useCustomScript();

	const isEmbeddedLayout = useEmbeddedLayout();

	if (isEmbeddedLayout) {
		return (
			<EmbeddedPreload>
				<AuthenticationCheck>
					<LayoutWithSidebar>
						<Suspense fallback={null}>{children}</Suspense>
					</LayoutWithSidebar>
				</AuthenticationCheck>
			</EmbeddedPreload>
		);
	}

	return (
		<Preload>
			<AuthenticationCheck>
				<LayoutWithSidebar>
					<Suspense fallback={null}>{children}</Suspense>
				</LayoutWithSidebar>
			</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
