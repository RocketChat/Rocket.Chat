import { NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';

type SidebarRailPhoneProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailPhone = (props: SidebarRailPhoneProps) => {
	const { t } = useTranslation();
	const callAction = useMediaCallAction();
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();

	const isCurrentPage = currentRoute?.includes('/call-history') ?? false;
	const isPanelOpen = useSidebarRailStore((state) => state.panel === 'calls');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	const handleClick = useStableCallback(() => {
		setPanel('calls');
		router.navigate('/call-history');
	});

	if (!callAction) {
		return null;
	}

	return (
		<NavBarItem
			{...props}
			title={t('Calls')}
			icon='phone'
			pressed={isPanelOpen}
			aria-current={isCurrentPage ? 'page' : undefined}
			onClick={handleClick}
		/>
	);
};

export default SidebarRailPhone;
