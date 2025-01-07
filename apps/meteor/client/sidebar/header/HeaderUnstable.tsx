import { Sidebar } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarHeaderToolbar from './SidebarHeaderToolbar';
import CreateRoom from './actions/CreateRoom';
import Directory from './actions/Directory';
import Login from './actions/Login';
import Search from './actions/Search';
import Sort from './actions/Sort';

const HeaderUnstable = (): ReactElement => {
	const { t } = useTranslation();
	const uid = useUserId();

	return (
		<Sidebar.TopBar.Section>
			<SidebarHeaderToolbar align='end' aria-label={t('Sidebar_actions')}>
				<Search title={t('Search')} />
				{uid && (
					<>
						<Directory title={t('Directory')} />
						<Sort title={t('Display')} />
						<CreateRoom title={t('Create_new')} data-qa='sidebar-create' />
					</>
				)}
				{!uid && <Login title={t('Login')} />}
			</SidebarHeaderToolbar>
		</Sidebar.TopBar.Section>
	);
};

export default memo(HeaderUnstable);
