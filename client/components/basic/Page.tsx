import { Box, Scrollable, ScrollableProps } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { createContext, useContext, useState, FC, Dispatch, SetStateAction } from 'react';

import { useSidebar } from '../../contexts/SidebarContext';
import BurgerMenuButton from './burger/BurgerMenuButton';
import { useSession } from '../../contexts/SessionContext';

type PageContextValue = [
	boolean,
	Dispatch<SetStateAction<boolean>>,
];

const PageContext = createContext<PageContextValue>([false, (): void => undefined]);

const Page: FC = (props) => {
	const [border, setBorder] = useState(false);
	return <PageContext.Provider value={[border, setBorder]}>
		<Box
			backgroundColor='surface'
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
};

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

type PageScrollableContentProps = {
	onScrollContent?: ScrollableProps['onScrollContent'];
};

const PageScrollableContent: FC<PageScrollableContentProps> = ({ onScrollContent, ...props }) =>
	<Scrollable onScrollContent={onScrollContent} >
		<Box p='x16' display='flex' flexDirection='column' flexGrow={1} {...props} />
	</Scrollable>;

const PageScrollableContentWithShadow: FC<PageScrollableContentProps> = ({ onScrollContent, ...props }) => {
	const [, setBorder] = useContext(PageContext);
	return <PageScrollableContent
		onScrollContent={({ top, ...args }): void => {
			setBorder(!top);
			onScrollContent && onScrollContent({ top, ...args });
		}}
		{ ...props }
	/>;
};

export default Object.assign(Page, {
	Header: PageHeader,
	Content: PageContent,
	ScrollableContent: PageScrollableContent,
	ScrollableContentWithShadow: PageScrollableContentWithShadow,
});
