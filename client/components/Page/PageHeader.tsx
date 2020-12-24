import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { useContext, FC } from 'react';

import BurgerMenuButton from '../burger/BurgerMenuButton';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSession } from '../../contexts/SessionContext';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: string;
};

const PageHeader: FC<PageHeaderProps> = ({ children = undefined, title, ...props }) => {
	const [border] = useContext(PageContext);
	const hasBurgerMenuButton = useMediaQuery('(max-width: 780px)');
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const unreadMessagesBadge = useSession('unread');

	const handleBurgerMenuButtonClick = (): void => {
		setSidebarOpen((isSidebarOpen) => !isSidebarOpen);
	};

	return <Box borderBlockEndWidth='x2' borderBlockEndColor={border ? 'neutral-200' : 'transparent'}>
		<Box
			marginBlock='x16'
			marginInline='x24'
			minHeight='x40'
			display='flex'
			flexDirection='row'
			flexWrap='nowrap'
			alignItems='center'
			color='neutral-800'
			{...props}
		>
			{hasBurgerMenuButton && <BurgerMenuButton
				open={isSidebarOpen}
				badge={unreadMessagesBadge}
				marginInlineEnd='x8'
				onClick={handleBurgerMenuButtonClick}
			/>}
			<Box is='h1' fontScale='h1' flexGrow={1}>{title}</Box>
			{children}
		</Box>
	</Box>;
};

export default PageHeader;
