import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import { useSession } from '../../contexts/SessionContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import BurgerBadge from './BurgerBadge';
import BurgerIcon from './BurgerIcon';

const BurgerMenu = (): ReactElement => {
	const t = useTranslation();
	const { sidebar } = useLayout();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const isSidebarOpen = sidebar.isOpen();
	const toggleSidebar = useMutableCallback(() => sidebar.toggle());

	return (
		<Box
			is='button'
			aria-label={isSidebarOpen ? t('Close_menu') : t('Open_menu')}
			type='button'
			position='relative'
			marginInlineEnd='x8'
			className={css`
				cursor: pointer;
			`}
			onClick={toggleSidebar}
		>
			<BurgerIcon open={isSidebarOpen} />
			{!isLayoutEmbedded && unreadMessagesBadge && <BurgerBadge>{unreadMessagesBadge}</BurgerBadge>}
		</Box>
	);
};

export default memo(BurgerMenu);
