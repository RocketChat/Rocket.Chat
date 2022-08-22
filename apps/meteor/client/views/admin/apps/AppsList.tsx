import { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import AppRow from './AppRow';

type AppsListProps = {
	apps: App[];
	title: string;
	isMarketplace: boolean;
} & ComponentProps<typeof Box>;

const AppsList = ({ apps, title, isMarketplace, ...props }: AppsListProps): ReactElement => (
	<>
		<Box is='h3' fontScale='h3' color='default' mbe='x20'>
			{title}
		</Box>
		<Box {...props}>
			{apps.map((app) => (
				<AppRow key={app.id} isMarketplace={isMarketplace} {...app} />
			))}
		</Box>
	</>
);

export default AppsList;
