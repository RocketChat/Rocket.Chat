import type { ReactElement, ReactNode } from 'react';
import { Suspense } from 'react';

import AuthenticationCheck from './AuthenticationCheck';
import EmbeddedPreload from './EmbeddedPreload';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';

type MainLayoutProps = {
	children?: ReactNode;
} & Record<string, unknown>;

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
