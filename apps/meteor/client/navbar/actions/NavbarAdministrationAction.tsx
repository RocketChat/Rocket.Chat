import { GenericMenu, useHandleMenuAction } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { useAdministrationMenu } from '../NavBarSettingsToolbar/hooks/useAdministrationMenu';
import { NavbarAction } from '../../components/Navbar';

const NavbarAdministrationAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();

	const administrationItems = useAdministrationMenu();

	const handleAction = useHandleMenuAction(administrationItems);

	const router = useRouter();

	return (
		<NavbarAction {...props}>
			<GenericMenu
				pressed={router.getLocationPathname().startsWith('/admin')}
				medium
				title={t('Administration')}
				icon='cog'
				onAction={handleAction}
				sections={administrationItems}
				placement='right-start'
			/>
		</NavbarAction>
	);
};

export default NavbarAdministrationAction;
