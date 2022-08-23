import { Box, Grid } from '@rocket.chat/fuselage';
import { usePermission, useAtLeastOnePermission, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContent from '../../components/Page/PageScrollableContent';
import CustomHomePageContent from './CustomHomePageContent';
import HomePageHeader from './HomePageHeader';
import HomepageGridItem from './HomepageGridItem';
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
			<PageScrollableContent>
				<Box is='h1' fontScale='h1' data-qa-id='homepage-welcome-text'>
					{t('Welcome_to', { Site_Name: workspaceName || 'Rocket.Chat' })}
				</Box>
				<Box is='h3' fontScale='h3' mb='x16'>
					{t('Some_ideas_to_get_you_started')}
				</Box>
				<Grid>
					{canAddUsers && (
						<HomepageGridItem>
							<AddUsersCard />
						</HomepageGridItem>
					)}
					{canCreateChannel && (
						<HomepageGridItem>
							<CreateChannelsCard />
						</HomepageGridItem>
					)}
					<HomepageGridItem>
						<JoinRoomsCard />
					</HomepageGridItem>
					<HomepageGridItem>
						<MobileAppsCard />
					</HomepageGridItem>
					<HomepageGridItem>
						<DesktopAppsCard />
					</HomepageGridItem>
					<HomepageGridItem>
						<DocumentationCard />
					</HomepageGridItem>
				</Grid>
				<Box mbs='x16'>
					<CustomHomePageContent />
				</Box>
			</PageScrollableContent>
		</Page>
	);
};

export default DefaultHomePage;
