import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarTogglerBadge from './SidebarTogglerBadge';

type SideBarTogglerButtonProps = {
	pressed?: boolean;
	badge?: ReactNode;
	onClick: () => void;
};

const SideBarTogglerButton = ({ pressed, badge, onClick }: SideBarTogglerButtonProps) => {
	const { t } = useTranslation();

	return (
		<Box position='relative'>
			<IconButton title={!pressed ? t('Open_sidebar') : t('Close_sidebar')} icon='burger-menu' pressed={pressed} small onClick={onClick} />
			{badge && <SidebarTogglerBadge>{badge}</SidebarTogglerBadge>}
		</Box>
	);
};

export default SideBarTogglerButton;
