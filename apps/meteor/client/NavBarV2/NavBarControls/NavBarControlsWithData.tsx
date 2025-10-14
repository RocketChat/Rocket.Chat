import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';

import NavBarControlsMenu from './NavBarControlsMenu';
import NavbarControlsWithCall from './NavBarControlsWithCall';
import { useIsCallEnabled } from '../../contexts/CallContext';
import { useOmnichannelContactAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelContactAction';
import { useOmnichannelLivechatToggle } from '../NavBarOmnichannelGroup/hooks/useOmnichannelLivechatToggle';
import { useOmnichannelQueueAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelQueueAction';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarControlsWithData = (props: NavBarControlsMenuProps) => {
	const isCallEnabled = useIsCallEnabled();

	const {
		isEnabled: queueEnabled,
		icon: queueIcon,
		title: queueTitle,
		handleGoToQueue,
		isPressed: isQueuePressed,
	} = useOmnichannelQueueAction();

	const {
		title: contactCenterTitle,
		icon: contactCenterIcon,
		handleGoToContactCenter,
		isPressed: isContactPressed,
	} = useOmnichannelContactAction();

	const {
		title: omnichannelLivechatTogglerTitle,
		icon: omnichannelLivechatTogglerIcon,
		handleAvailableStatusChange,
	} = useOmnichannelLivechatToggle();

	const omnichannelItems = [
		queueEnabled && {
			id: 'omnichannelQueue',
			icon: queueIcon,
			content: queueTitle,
			onClick: handleGoToQueue,
		},
		{
			id: 'omnichannelContact',
			icon: contactCenterIcon,
			content: contactCenterTitle,
			onClick: handleGoToContactCenter,
		},
		{
			id: 'omnichannelLivechatToggler',
			icon: omnichannelLivechatTogglerIcon,
			content: omnichannelLivechatTogglerTitle,
			onClick: handleAvailableStatusChange,
		},
	].filter(Boolean) as GenericMenuItemProps[];

	const isPressed = isQueuePressed || isContactPressed;

	if (isCallEnabled) {
		return <NavbarControlsWithCall omnichannelItems={omnichannelItems} isPressed={isPressed} {...props} />;
	}

	return <NavBarControlsMenu omnichannelItems={omnichannelItems} isPressed={isPressed} {...props} />;
};

export default NavBarControlsWithData;
