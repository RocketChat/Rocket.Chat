import { Box, Scrollable } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { createContext, useContext, useState } from 'react';

import { useSidebar } from '../../contexts/SidebarContext';
import BurgerMenuButton from './burger/BurgerMenuButton';
import { useSession } from '../../contexts/SessionContext';

const PageContext = createContext();

function Page(props) {
	const [border, setBorder] = useState(false);
	return <PageContext.Provider value={[border, setBorder]}>
		<Box
			is='section'
			display='flex'
			flexDirection='column'
			flexGrow={1}
			flexShrink={1}
			height='full'
			overflow='hidden'
			{...props}
		/>
	</PageContext.Provider>;
}

function PageHeader({ children, title, ...props }) {
	const [border] = useContext(PageContext);
	const hasBurgerMenuButton = useMediaQuery('(max-width: 780px)');
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const unreadMessagesBadge = useSession('unread');

	const handleBurgerMenuButtonClick = () => {
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
}

const PageContent = React.forwardRef(function PageContent(props, ref) {
	return <Box
		ref={ref}
		paddingInline='x24'
		display='flex'
		flexDirection='column'
		overflowY='hidden'
		height='full'
		{...props}
	/>;
});

function PageScrollableContent({ onScrollContent, ...props }) {
	return <Scrollable onScrollContent={onScrollContent} >
		<Box padding='x16' display='flex' flexDirection='column' flexGrow={1} {...props} />
	</Scrollable>;
}

function PageScrollableContentWithShadow({ onScrollContent, ...props }) {
	const [, setBorder] = useContext(PageContext);
	return <PageScrollableContent
		onScrollContent={({ top, ...args }) => {
			setBorder(!top);
			onScrollContent && onScrollContent({ top, ...args });
		}}
		{ ...props }
	/>;
}

Page.Header = PageHeader;
Page.Content = PageContent;
Page.ScrollableContent = PageScrollableContent;
Page.ScrollableContentWithShadow = PageScrollableContentWithShadow;

export default Page;
