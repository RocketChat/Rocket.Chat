import React, { ReactElement, useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { SideNav } from '../../../app/ui-utils/client';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { lazyPage } from '../../lib/lazyPage';
import './sidebarItems';

const AccountProfilePage = lazyPage(() => import('./AccountProfilePage'));
const AccountPreferencesPage = lazyPage(() => import('./preferences/AccountPreferencesPage'));
const AccountSecurityPage = lazyPage(() => import('./security/AccountSecurityPage'));
const AccountIntegrationsPage = lazyPage(() => import('./AccountIntegrationsPage'));
const AccountTokensPage = lazyPage(() => import('./tokens/AccountTokensPage'));

const AccountRoute = (): ReactElement => {
	useEffect(() => {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});

	const webdavEnabled = useSetting('Webdav_Integration_Enabled');
	const canCreateTokens = usePermission('create-personal-access-tokens');

	return (
		<Switch>
			<Route path='/account/profile' component={AccountProfilePage} />
			<Route path='/account/preferences' component={AccountPreferencesPage} />
			<Route path='/account/security' component={AccountSecurityPage} />
			<Route
				path='/account/integrations'
				component={webdavEnabled ? AccountIntegrationsPage : NotAuthorizedPage}
			/>
			<Route
				path='/account/tokens'
				component={canCreateTokens ? AccountTokensPage : NotAuthorizedPage}
			/>
			<Redirect from='/account' to='/account/profile' />
		</Switch>
	);
};

export default AccountRoute;
