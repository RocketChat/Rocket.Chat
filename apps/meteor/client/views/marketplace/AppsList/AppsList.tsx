import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import AppRow from './AppRow';

type AppsListProps = {
	apps: App[];
	title?: string;
	appsListId: string;
};

const AppsList = ({ apps, title, appsListId }: AppsListProps): ReactElement => {
	return (
		<>
			{title && (
				<Box is='h2' id={appsListId} fontScale='h3' color='default' mbe={20}>
					{title}
				</Box>
			)}
			<Box aria-labelledby={appsListId} mbe={24} role='list'>
				{apps.map((app) => (
					<AppRow key={app.id} {...app} />
				))}
			</Box>
		</>
	);
};

export default AppsList;
