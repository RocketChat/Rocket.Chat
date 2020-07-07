import React, { useEffect } from 'react';

import { useRouteParameter, useRoute } from '../contexts/RouterContext';
import { SideNav } from '../../app/ui-utils';
import AccountProfilePage from './AccountProfilePage';
import AccountPreferencesPage from './preferences/AccountPreferencesPage';
import AccountSecurityPage from './security/AccountSecurityPage';
import AccountTokensPage from './tokens/AccountTokensPage';
import './sidebarItems';

const AccountRoute = () => {
	const page = useRouteParameter('group');
	const router = useRoute('account');

	useEffect(() => { !page && router.push({ group: 'profile' }); }, [page, router]);

	useEffect(() => {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});

	if (page === 'profile') {
		return <AccountProfilePage />;
	}
	if (page === 'preferences') {
		return <AccountPreferencesPage />;
	}
	if (page === 'security') {
		return <AccountSecurityPage />;
	}
	if (page === 'tokens') {
		return <AccountTokensPage />;
	}
	return null;
};

export default AccountRoute;
