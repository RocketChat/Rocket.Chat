import type { App } from '@rocket.chat/core-typings';
import { CardGroup, Text } from '@rocket.chat/fuselage';

import AppRow from './AppRow';
import AppsListSection from './layout/AppsListSection';

export type AppsListProps = {
	apps: App[];
	title?: string;
	appsListId: string;
};

const AppsList = ({ apps, title, appsListId }: AppsListProps) => {
	return (
		<AppsListSection>
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
		</AppsListSection>
	);
};

export default AppsList;
