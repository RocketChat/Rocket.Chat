import React, { ReactElement, useMemo } from 'react';

import BlazeTemplate from '../BlazeTemplate';
import AuthenticationCheck from './AuthenticationCheck';
import Preload from './Preload';
import { useCustomScript } from './useCustomScript';

type MainLayoutProps = {
	center?: string;
} & Record<string, unknown>;

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	useCustomScript();

	return (
		<Preload>
			<AuthenticationCheck>{useMemo(() => (center ? <BlazeTemplate template={center} /> : null), [center])}</AuthenticationCheck>
		</Preload>
	);
};

export default MainLayout;
