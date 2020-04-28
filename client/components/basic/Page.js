import { Box, Flex, Margins, Scrollable } from '@rocket.chat/fuselage';
import React, { createContext, useContext, useState } from 'react';

import { BurgerMenuButton } from './BurgerMenuButton';

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
	return <Box
		borderBlockEndWidth='x2'
		borderBlockEndColor={border ? 'neutral-200' : 'transparent'}
	>
		<Margins block='x16' inline='x24'>
			<Flex.Container wrap='no-wrap' alignItems='center' direction='row'>
				<Box {...props}>
					<Margins inlineEnd='x8'>
						<BurgerMenuButton />
					</Margins>
					<Flex.Item grow={1}>
						<Box is='h1' fontScale='h1'>{title}</Box>
					</Flex.Item>
					{children}
				</Box>
			</Flex.Container>
		</Margins>
	</Box>;
}

function PageContent(props) {
	return <Box
		paddingInline='x24'
		display='flex'
		flexDirection='column'
		overflowY='hidden'
		height='full'
		{...props}
	/>;
}

function PageScrollableContent({ onScrollContent, ...props }) {
	return <Scrollable onScrollContent={onScrollContent} >
		<Box padding='x16' flexGrow={1} {...props} />
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
