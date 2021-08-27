import { EJSONable } from 'meteor/ejson';
import React, { Fragment, ReactElement } from 'react';
import { useSubscription } from 'use-subscription';

import { blazePortals } from '../../lib/portals/blazePortals';
import BlazeTemplate from './BlazeTemplate';

type AppLayoutProps = {
	template: string;
	data?: EJSONable;
};

const AppLayout = ({ template, data }: AppLayoutProps): ReactElement => {
	const portals = useSubscription(blazePortals);

	return (
		<>
			<BlazeTemplate template={template} data={data} />
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default AppLayout;
