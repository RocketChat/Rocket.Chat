import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useSession } from '../../../contexts/SessionContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import BurgerIcon from './BurgerIcon';
import BurgerBadge from './BurgerBadge';

function BurgerMenuButton(props) {
	const isVisible = useMediaQuery('(max-width: 780px)');
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');
	const t = useTranslation();

	const handleClick = () => {
		setSidebarOpen(!isSidebarOpen);
	};

	if (!isVisible) {
		return null;
	}

	return <Box
		is='button'
		aria-label={isSidebarOpen ? t('Close menu') : t('Open menu')}
		type='button'
		position='relative'
		className={css`cursor: pointer;`}
		onClick={handleClick}
		{...props}
	>
		<BurgerIcon open={isSidebarOpen} />
		{!isLayoutEmbedded && unreadMessagesBadge
			&& <BurgerBadge>{unreadMessagesBadge}</BurgerBadge>}
	</Box>;
}

export default BurgerMenuButton;
