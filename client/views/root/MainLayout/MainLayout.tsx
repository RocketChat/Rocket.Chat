import React, { ReactElement, useMemo } from 'react';

import BlazeTemplate from '../BlazeTemplate';
import AuthenticationCheck from './AuthenticationCheck';
import Preload from './Preload';

type MainLayoutProps = {
	center?: string;
};

const MainLayout = ({ center }: MainLayoutProps): ReactElement => (
	<Preload>
		<AuthenticationCheck>{useMemo(() => (center ? <BlazeTemplate template={center} /> : null), [center])}</AuthenticationCheck>
	</Preload>
);

export default MainLayout;
