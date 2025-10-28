import type { App } from '@rocket.chat/core-typings';
import { Box, CardGroup } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import AppRow from './AppRow';

type AppsListProps = {
	apps: App[];
	title?: string;
	appsListId: string;
};

const AppsList = ({ apps, title, appsListId }: AppsListProps): ReactElement => {
	return (
		<Box mbe={16}>
			{title && (
				<Box is='h2' id={appsListId} fontScale='h3' color='default' mbe={20}>
					{title}
				</Box>
			)}
			<CardGroup vertical stretch aria-labelledby={appsListId} role='list'>
				{apps.map((app) => (
					<AppRow key={app.id} {...app} />
				))}
			</CardGroup>
		</Box>
	);
};

export default AppsList;
