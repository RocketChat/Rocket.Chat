import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import SidebarTogglerBadge from './SidebarTogglerBadge';

type SideBarTogglerButtonProps = {
	badge?: number | unknown;
	onClick: () => void;
};

const SideBarTogglerButton = ({ badge, onClick }: SideBarTogglerButtonProps) => {
	const t = useTranslation();

	return (
		<Box position='relative'>
			<IconButton icon='burger-menu' small aria-label={t('Open_sidebar')} marginInlineEnd={8} onClick={onClick} />
			{badge && <SidebarTogglerBadge>{badge}</SidebarTogglerBadge>}
		</Box>
	);
};

export default SideBarTogglerButton;
