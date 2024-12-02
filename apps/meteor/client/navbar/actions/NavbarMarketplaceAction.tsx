import { IconButton } from '@rocket.chat/fuselage';
import { GenericMenu, useHandleMenuAction } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { NavbarAction } from '../../components/Navbar';
import { useAppsItems } from '../../sidebar/header/actions/hooks/useAppsItems';

const NavbarMarketplaceAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();
	const router = useRouter();
	const routeName = router.getRouteName();

	const appItems = useAppsItems();

	const handleAction = useHandleMenuAction(appItems);

	const showApps = appItems.length > 0;

	if (!showApps) {
		return (
			<NavbarAction {...props}>
				<IconButton icon='store' disabled />
			</NavbarAction>
		);
	}

	return (
		<NavbarAction {...props}>
			<GenericMenu
				pressed={routeName === 'marketplace'}
				medium
				title={t('Marketplace')}
				icon='store'
				onAction={handleAction}
				items={appItems}
				placement='right-start'
			/>
		</NavbarAction>
	);
};

export default NavbarMarketplaceAction;
