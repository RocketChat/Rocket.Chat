import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarTogglerBadge from './SidebarTogglerBadge';

type SideBarTogglerButtonProps = {
	badge?: ReactNode;
	onClick: () => void;
};

const SideBarTogglerButton = ({ badge, onClick }: SideBarTogglerButtonProps) => {
	const { t } = useTranslation();

	return (
		<Box position='relative'>
			<IconButton icon='burger-menu' small aria-label={t('Open_sidebar')} marginInlineEnd={8} onClick={onClick} />
			{badge && <SidebarTogglerBadge>{badge}</SidebarTogglerBadge>}
		</Box>
	);
};

export default SideBarTogglerButton;
