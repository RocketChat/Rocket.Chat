import React, { ReactElement, ReactNode, Suspense, useMemo } from 'react';

import BlazeTemplate from '../BlazeTemplate';
import AuthenticationCheck from './AuthenticationCheck';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';

type MainLayoutProps = {
	children?: ReactNode;
	center?: string;
} & Record<string, unknown>;

const MainLayout = ({ children, center }: MainLayoutProps): ReactElement => {
	useCustomScript();

	children = useMemo(() => {
		if (children) {
			return children;
		}

		if (center) {
			return <BlazeTemplate template={center} />;
		}

		return null;
	}, [children, center]);

	return (
		<Preload>
			<AuthenticationCheck>
				<Suspense fallback={null}>{children}</Suspense>
			</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
