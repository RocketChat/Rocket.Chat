import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { BurgerMenuButton } from './BurgerMenuButton';
import { useSidebarState, useUnreadMessagesBadge } from './hooks';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';

export function Header({
	children,
	hideHelp,
	rawSectionName,
	sectionName,
}) {
	const [isSidebarOpen, toggleSidebarOpen] = useSidebarState();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useUnreadMessagesBadge();
	const t = useTranslation();

	const handleClick = () => {
		toggleSidebarOpen();
	};

	return <header className='rc-header'>
		<div className='rc-header__wrap'>
			<div className='rc-header__block rc-header--burger'>
				<BurgerMenuButton
					isSidebarOpen={isSidebarOpen}
					isLayoutEmbedded={isLayoutEmbedded}
					unreadMessagesBadge={unreadMessagesBadge}
					onClick={handleClick}
				/>
			</div>

			<span className='rc-header__block'>{rawSectionName || t(sectionName)}</span>

			{children}

			{!hideHelp && <div className='rc-header__section-help' />}
		</div>
	</header>;
}
