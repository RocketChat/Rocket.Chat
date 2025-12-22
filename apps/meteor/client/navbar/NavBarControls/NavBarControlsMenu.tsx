import { NavBarItem } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelEnabled } from '../../views/omnichannel/hooks/useOmnichannelEnabled';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	omnichannelItems: GenericMenuItemProps[];
	isPressed: boolean;
	callItem?: GenericMenuItemProps;
	callHistoryItem?: GenericMenuItemProps;
};

const NavBarControlsMenu = ({ omnichannelItems, isPressed, callItem, callHistoryItem, ...props }: NavBarControlsMenuProps) => {
	const { t } = useTranslation();
	const showOmnichannel = useOmnichannelEnabled();

	const sections = [
		{
			title: t('Voice_Call'),
			items: callItem || callHistoryItem ? ([callItem, callHistoryItem].filter(Boolean) as GenericMenuItemProps[]) : [],
		},
		{
			title: t('Omnichannel'),
			items: showOmnichannel ? omnichannelItems : [],
		},
	].filter((section) => section.items.length > 0);

	if (sections.length === 0) {
		return null;
	}

	return (
		<GenericMenu
			sections={sections}
			title={t('Voice_and_omnichannel')}
			is={NavBarItem}
			placement='bottom-start'
			icon='kebab'
			pressed={isPressed}
			{...props}
		/>
	);
};

export default NavBarControlsMenu;
