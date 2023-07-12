import { useTranslation } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import { NavbarAction } from '../../components/Navbar';
import { useAdministrationItems } from '../../sidebar/header/actions/hooks/useAdministrationItems';

const NavbarAdministrationAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();

	const administrationItems = useAdministrationItems().map((item) => {
		delete item.icon;
		return item;
	});

	const handleAction = useHandleMenuAction(administrationItems);

	return (
		<NavbarAction {...props}>
			<GenericMenu medium title={t('Administration')} icon='cog' onAction={handleAction} items={administrationItems} />
		</NavbarAction>
	);
};

export default NavbarAdministrationAction;
