import React, { Fragment, ReactElement } from 'react';
import { useSubscription } from 'use-subscription';

import { blazePortals } from '../../lib/portals/blazePortals';
import BlazeTemplate from './BlazeTemplate';

type MainLayoutProps = {
	center?: string;
};

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	const portals = useSubscription(blazePortals);

	return (
		<>
			<BlazeTemplate template='main' data={{ center }} />
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default MainLayout;
