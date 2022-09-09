import { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import AppRow from './AppRow';

type AppsListProps = {
	apps: App[];
	title: string;
	isMarketplace: boolean;
};

const AppsList = ({ apps, title, isMarketplace }: AppsListProps): ReactElement => (
	<>
		<Box is='h3' fontScale='h3' color='default' mbe='x20'>
			{title}
		</Box>
		<Box mbe='x36'>
			{apps.map((app) => (
				<AppRow key={app.id} isMarketplace={isMarketplace} {...app} />
			))}
		</Box>
	</>
);

export default AppsList;
