import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useSetting, useLayout, useAllPermissions } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import BurgerMenu from '../../components/BurgerMenu';
import TemplateHeader from '../../components/Header';
import Page from '../../components/Page/Page';
import CustomHomePage from './CustomHomePage';

// TODO: use a setting to determine if the user has a custom home page
const custom = false;

const editLayoutPermissions = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

const HomePage = (): ReactElement => {
	const title = useSetting('Layout_Home_Title') as string;
	const { isMobile } = useLayout();
	const canEditLayout = useAllPermissions(editLayoutPermissions);

	if (custom) {
		return <CustomHomePage />;
	}

	return (
		<Page data-qa='page-home'>
			<Box marginBlock='x16' marginInline='x24' display='flex' flexDirection='row' justifyContent='space-between'>
				{isMobile && (
					<TemplateHeader.ToolBox>
						<BurgerMenu />
					</TemplateHeader.ToolBox>
				)}
				<Box as='h2' fontScale='h2' flexGrow={1}>
					{title}
				</Box>
				{canEditLayout && (
					<Button is='a' href='/admin/settings/Layout'>
						<>
							<Icon name='pencil' size='x16' /> Customize
						</>
					</Button>
				)}
			</Box>
		</Page>
	);
};

export default HomePage;
