import type { App } from '@rocket.chat/core-typings';
import { CardGroup, Stack, Text } from '@rocket.chat/fuselage';

import AppRow from './AppRow';

export type AppsListProps = {
	apps: App[];
	title?: string;
	appsListId: string;
};

const AppsList = ({ apps, title, appsListId }: AppsListProps) => {
	return (
		<Stack gap='x20'>
			{title && (
				<Text is='h2' id={appsListId} fontScale='h3' color='default'>
					{title}
				</Text>
			)}
			<CardGroup vertical stretch aria-labelledby={appsListId} role='list'>
				{apps.map((app) => (
					<AppRow key={app.id} {...app} />
				))}
			</CardGroup>
		</Stack>
	);
};

export default AppsList;
