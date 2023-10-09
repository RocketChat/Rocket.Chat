import { Box, Grid } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useRole, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContent from '../../components/Page/PageScrollableContent';
import HomePageHeader from './HomePageHeader';
import HomepageGridItem from './HomepageGridItem';
import AddUsersCard from './cards/AddUsersCard';
import CustomContentCard from './cards/CustomContentCard';

const DefaultHomePage = (): ReactElement => {
	const t = useTranslation();
	const canAddUsers = usePermission('view-user-administration');
	const isAdmin = useRole('admin');
	const workspaceName = useSetting('Site_Name');
	const isCustomContentBodyEmpty = useSetting('Layout_Home_Body') === '';
	const isCustomContentVisible = Boolean(useSetting('Layout_Home_Custom_Block_Visible'));

	return (
		<Page color='default' data-qa='page-home' data-qa-type='default' background='tint'>
			<HomePageHeader />
			<PageScrollableContent>
				<Box is='h2' fontScale='h1' mb={20} data-qa-id='homepage-welcome-text'>
					{t('Welcome_to_workspace', { Site_Name: workspaceName || 'Rocket.Chat' })}
				</Box>
				<Grid margin='neg-x8'>
					{canAddUsers && (
						<HomepageGridItem>
							<AddUsersCard />
						</HomepageGridItem>
					)}
				</Grid>
				{(isAdmin || (isCustomContentVisible && !isCustomContentBodyEmpty)) && (
					<Box pbs={16} mbe={32}>
						<CustomContentCard />
					</Box>
				)}
			</PageScrollableContent>
		</Page>
	);
};

export default DefaultHomePage;
