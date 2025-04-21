import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';

import NavBarControlsMenu from './NavBarControlsMenu';
import { useOmnichannelCallDialPadAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelCallDialPadAction';
import { useOmnichannelCallToggleAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelCallToggleAction';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	voipItems: GenericMenuItemProps[];
	omnichannelItems: GenericMenuItemProps[];
	isPressed: boolean;
};

const NavBarControlsWithCall = ({ voipItems, omnichannelItems, isPressed, ...props }: NavBarControlsMenuProps) => {
	const {
		icon: omnichannelCallIcon,
		title: omnichannelCallTitle,
		handleOpenDialModal,
		isDisabled: callDialPadDisabled,
	} = useOmnichannelCallDialPadAction();

	const {
		title: omnichannelCallTogglerTitle,
		icon: omnichannelCallTogglerIcon,
		handleToggleCall,
		isDisabled: callTogglerDisabled,
	} = useOmnichannelCallToggleAction();

	const omnichannelItemsWithCall = [
		...omnichannelItems,
		{
			id: 'omnichannelCallDialPad',
			icon: omnichannelCallIcon,
			content: omnichannelCallTitle,
			onClick: handleOpenDialModal,
			disabled: callDialPadDisabled,
		},
		{
			id: 'omnichannelCallToggler',
			icon: omnichannelCallTogglerIcon,
			content: omnichannelCallTogglerTitle,
			onClick: handleToggleCall,
			disabled: callTogglerDisabled,
		},
	] as GenericMenuItemProps[];

	return <NavBarControlsMenu voipItems={voipItems} omnichannelItems={omnichannelItemsWithCall} isPressed={isPressed} {...props} />;
};

export default NavBarControlsWithCall;
