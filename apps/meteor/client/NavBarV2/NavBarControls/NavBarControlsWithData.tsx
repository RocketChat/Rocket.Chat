import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';

import NavBarControlsMenu from './NavBarControlsMenu';
import NavbarControlsWithCall from './NavBarControlsWithCall';
import { useIsCallEnabled } from '../../contexts/CallContext';
import { useOmnichannelContactAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelContactAction';
import { useOmnichannelLivechatToggle } from '../NavBarOmnichannelGroup/hooks/useOmnichannelLivechatToggle';
import { useOmnichannelQueueAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelQueueAction';
import { useVoipDialerAction } from '../NavBarVoipGroup/hooks/useVoipDialerAction';
import { useVoipTogglerAction } from '../NavBarVoipGroup/hooks/useVoipTogglerAction';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarControlsWithData = (props: NavBarControlsMenuProps) => {
	const isCallEnabled = useIsCallEnabled();

	const { title: dialerTitle, handleToggleDialer, isPressed: isVoipDialerPressed, isDisabled: dialerDisabled } = useVoipDialerAction();
	const { isRegistered, title: togglerTitle, handleToggleVoip, isDisabled: togglerDisabled } = useVoipTogglerAction();

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

	const voipItems = [
		{
			id: 'voipDialer',
			icon: 'dialpad',
			content: dialerTitle,
			onClick: handleToggleDialer,
			disabled: dialerDisabled,
		},
		{
			id: 'voipToggler',
			icon: isRegistered ? 'phone-disabled' : 'phone',
			content: togglerTitle,
			onClick: handleToggleVoip,
			disabled: togglerDisabled,
		},
	].filter(Boolean) as GenericMenuItemProps[];

	const omnichannelItems = [
		queueEnabled && {
			id: 'omnichannelQueue',
			icon: queueIcon,
			content: queueTitle,
			onClick: handleGoToQueue,
			disabled: dialerDisabled,
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

	const isPressed = isVoipDialerPressed || isQueuePressed || isContactPressed;

	if (isCallEnabled) {
		return <NavbarControlsWithCall voipItems={voipItems} omnichannelItems={omnichannelItems} isPressed={isPressed} {...props} />;
	}

	return <NavBarControlsMenu voipItems={voipItems} omnichannelItems={omnichannelItems} isPressed={isPressed} {...props} />;
};

export default NavBarControlsWithData;
