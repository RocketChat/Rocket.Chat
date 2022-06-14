import { Box, Grid } from '@rocket.chat/fuselage';
import { usePermission, useAtLeastOnePermission, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
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
	const t = useTranslation();
	const canAddUsers = usePermission('view-user-administration');
	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const workspaceName = useSetting('Site_Name');

	return (
		<Page data-qa='page-home' data-qa-type='default' backgroundColor='neutral-100'>
			<HomePageHeader />
			<Box marginBlock='x36' marginInline='x24' minHeight='x40'>
				<Box is='h1' fontScale='h1' flexGrow={1}>
					{/* eslint-disable-next-line @typescript-eslint/camelcase */}
					{t('Welcome_to', { Site_Name: workspaceName || 'Rocket.Chat' })}
				</Box>
			</Box>
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
