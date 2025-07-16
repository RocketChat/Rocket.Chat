import { Sidebar, SidebarDivider, SidebarSection } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useTranslation, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import SidebarHeaderToolbar from './SidebarHeaderToolbar';
import UserAvatarWithStatus from './UserAvatarWithStatus';
import UserMenu from './UserMenu';
import Administration from './actions/Administration';
import CreateRoom from './actions/CreateRoom';
import Directory from './actions/Directory';
import Home from './actions/Home';
import Login from './actions/Login';
import Search from './actions/Search';
import Sort from './actions/Sort';

const Header = (): ReactElement => {
	const t = useTranslation();
	const user = useUser();

	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOff>
				<Sidebar.TopBar.Section>
					{user ? <UserMenu user={user} /> : <UserAvatarWithStatus />}
					<SidebarHeaderToolbar aria-label={t('Sidebar_actions')}>
						<Home title={t('Home')} />
						<Search title={t('Search')} />
						{user && (
							<>
								<Directory title={t('Directory')} />
								<Sort title={t('Display')} />
								<CreateRoom title={t('Create_new')} data-qa='sidebar-create' />
								<Administration title={t('Administration')} />
							</>
						)}
						{!user && <Login title={t('Login')} />}
					</SidebarHeaderToolbar>
				</Sidebar.TopBar.Section>
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<SidebarSection>
					{user ? <UserMenu user={user} /> : <UserAvatarWithStatus />}
					<SidebarHeaderToolbar aria-label={t('Sidebar_actions')}>
						<Home title={t('Home')} />
						<Search title={t('Search')} />
						{user && (
							<>
								<Directory title={t('Directory')} />
								<Sort title={t('Display')} />
								<CreateRoom title={t('Create_new')} data-qa='sidebar-create' />
								<Administration title={t('Administration')} />
							</>
						)}
						{!user && <Login title={t('Login')} />}
					</SidebarHeaderToolbar>
				</SidebarSection>
				<SidebarDivider />
			</FeaturePreviewOn>
		</FeaturePreview>
	);
};

export default memo(Header);
