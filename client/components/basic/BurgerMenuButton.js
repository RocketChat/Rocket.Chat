import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useSession } from '../../contexts/SessionContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import BurgerIcon from './burger/BurgerIcon';
import BurgerBadge from './burger/BurgerBadge';

function BurgerMenuButton(props) {
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');
	const t = useTranslation();

	const handleClick = () => {
		setSidebarOpen(!isSidebarOpen);
	};

	return <Box
		is='button'
		aria-label={isSidebarOpen ? t('Close menu') : t('Open menu')}
		className={[
			css`
				position: relative;
				display: none;
				visibility: hidden;
				cursor: pointer;

				.rtl & {
					right: 0;
					left: auto;
					margin-right: 7px;
					margin-left: auto;
				}

				@media (max-width: 780px) {
					& {
						display: inline-block;
						visibility: visible;
					}
				}
			`,
		]}
		type='button'
		onClick={handleClick}
		{...props}
	>
		<BurgerIcon open={isSidebarOpen} />
		{!isLayoutEmbedded && unreadMessagesBadge && <BurgerBadge>{unreadMessagesBadge}</BurgerBadge>}
	</Box>;
}

export default BurgerMenuButton;
