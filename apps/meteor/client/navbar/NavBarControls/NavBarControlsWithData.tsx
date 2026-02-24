import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useCallback, type HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarControlsMenu from './NavBarControlsMenu';
import { useOmnichannelContactAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelContactAction';
import { useOmnichannelLivechatToggle } from '../NavBarOmnichannelGroup/hooks/useOmnichannelLivechatToggle';
import { useOmnichannelQueueAction } from '../NavBarOmnichannelGroup/hooks/useOmnichannelQueueAction';

type NavBarControlsMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarControlsWithData = (props: NavBarControlsMenuProps) => {
	const { t } = useTranslation();
	const callAction = useMediaCallAction();

	const router = useRouter();
	const openCallHistory = useCallback(() => {
		router.navigate('/call-history');
	}, [router]);

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

	const callItem = callAction
		? {
				id: 'rcx-media-call',
				icon: callAction.icon,
				content: callAction.title,
				onClick: () => callAction.action(),
			}
		: undefined;

	const callHistoryItem = callAction
		? {
				id: 'rcx-media-call-history',
				icon: 'clock' as const,
				content: t('Call_history'),
				onClick: openCallHistory,
			}
		: undefined;

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

	return (
		<NavBarControlsMenu
			callHistoryItem={callHistoryItem}
			callItem={callItem}
			omnichannelItems={omnichannelItems}
			isPressed={isPressed}
			{...props}
		/>
	);
};

export default NavBarControlsWithData;
