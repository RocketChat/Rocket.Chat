import { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import AppRow from './AppRow';

type AppsListMainProps = {
	apps: App[];
	title: string;
	isMarketplace: boolean;
};

const AppsList = ({ apps, title, isMarketplace }: AppsListMainProps): ReactElement => (
	<>
		<Box is='h3' fontSize='h3' fontWeight={700} lineHeight='x28' color='default' mbe='x20'>
			{title}
		</Box>
		<Box overflowY='auto' height='100%'>
			{apps.map((app) => (
				<AppRow key={app.id} isMarketplace={isMarketplace} {...app} />
			))}
		</Box>
	</>
);

export default AppsList;
