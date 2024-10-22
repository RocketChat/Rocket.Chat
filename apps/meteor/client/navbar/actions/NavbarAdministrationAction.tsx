import { GenericMenu, useHandleMenuAction } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { NavbarAction } from '../../components/Navbar';
import { useAdministrationItems } from '../../sidebar/header/actions/hooks/useAdministrationItems';

const NavbarAdministrationAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();

	const administrationItems = useAdministrationItems();

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
				items={administrationItems}
				placement='right-start'
			/>
		</NavbarAction>
	);
};

export default NavbarAdministrationAction;
