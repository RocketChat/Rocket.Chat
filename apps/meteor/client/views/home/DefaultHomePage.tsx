import { Grid } from '@rocket.chat/fuselage';
import { usePermission, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContent from '../../components/Page/PageScrollableContent';
import HomePageHeader from './HomePageHeader';
import AddUsersCard from './cards/AddUsersCard';
import CreateChannelsCard from './cards/CreateChannelsCard';
import DesktopAppsCard from './cards/DesktopAppsCard';
import DocumentationCard from './cards/DocumentationCard';
import JoinRoomsCard from './cards/JoinRoomsCard';
import MobileAppsCard from './cards/MobileAppsCard';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const DefaultHomePage = (): ReactElement => {
	const canAddUsers = usePermission('view-user-administration');
	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);

	return (
		<Page data-qa='page-home' backgroundColor='neutral-100'>
			<HomePageHeader />
			<PageScrollableContent>
				{/* Fix grid styling */}
				<Grid>
					{canAddUsers && (
						<Grid.Item>
							<AddUsersCard />
						</Grid.Item>
					)}
					{canCreateChannel && (
						<Grid.Item>
							<CreateChannelsCard />
						</Grid.Item>
					)}
					<Grid.Item>
						<JoinRoomsCard />
					</Grid.Item>
					<Grid.Item>
						<MobileAppsCard />
					</Grid.Item>
					<Grid.Item>
						<DesktopAppsCard />
					</Grid.Item>
					<Grid.Item>
						<DocumentationCard />
					</Grid.Item>
				</Grid>
			</PageScrollableContent>
		</Page>
	);
};

export default DefaultHomePage;
