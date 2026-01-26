import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import { Suspense } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import EmbeddedPreload from './EmbeddedPreload';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';

type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children = null }: MainLayoutProps): ReactElement => {
	useCustomScript();

	const isEmbeddedLayout = useEmbeddedLayout();

	if (isEmbeddedLayout) {
		return (
			<EmbeddedPreload>
				<AuthenticationCheck>
					<Suspense fallback={null}>{children}</Suspense>
				</AuthenticationCheck>
			</EmbeddedPreload>
		);
	}

	return (
		<Preload>
			<AuthenticationCheck>
				<Suspense fallback={null}>{children}</Suspense>
			</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
