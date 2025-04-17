import { NavBarItem } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	voipItems: GenericMenuItemProps[];
	omnichannelItems: GenericMenuItemProps[];
	isVoipEnabled: boolean;
	isPressed: boolean;
};

const NavBarControlsMenu = ({ voipItems, omnichannelItems, isVoipEnabled, isPressed, ...props }: NavBarControlsMenuProps) => {
	const { t } = useTranslation();

	const sections = [
		{
			title: t('Voice_Call'),
			items: isVoipEnabled ? voipItems : [],
		},
		{
			title: t('Omnichannel'),
			items: omnichannelItems,
		},
	].filter((section) => section.items.length > 0);

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
