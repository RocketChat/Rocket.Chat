import { useRouteParameter, useRoute, useCurrentRoute, useSetting, usePermission } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import NotAuthorizedPage from '../notAuthorized/NotAuthorizedPage';
import AccountIntegrationsPage from './AccountIntegrationsPage';
import AccountProfilePage from './AccountProfilePage';
import AccountPreferencesPage from './preferences/AccountPreferencesPage';
import AccountSecurityPage from './security/AccountSecurityPage';
import AccountTokensPage from './tokens/AccountTokensPage';
import './sidebarItems';

const AccountRoute = () => {
	const [routeName] = useCurrentRoute();
	const page = useRouteParameter('group');
	const router = useRoute('account');

	useEffect(() => {
		if (routeName !== 'account') {
			return;
		}

		!page && router.push({ group: 'profile' });
	}, [routeName, page, router]);

	useEffect(() => {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});

	const webdavEnabled = useSetting('Webdav_Integration_Enabled');
	const canCreateTokens = usePermission('create-personal-access-tokens');

	if (page === 'profile') {
		return <AccountProfilePage />;
	}

	if (page === 'preferences') {
		return <AccountPreferencesPage />;
	}

	if (page === 'security') {
		return <AccountSecurityPage />;
	}

	if (page === 'integrations') {
		if (!webdavEnabled) {
			return <NotAuthorizedPage />;
		}

		return <AccountIntegrationsPage />;
	}

	if (page === 'tokens') {
		if (!canCreateTokens) {
			return <NotAuthorizedPage />;
		}

		return <AccountTokensPage />;
	}

	return null;
};

export default AccountRoute;
