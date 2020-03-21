import { Box, Flex, Margins, Scrollable } from '@rocket.chat/fuselage';
import React, { useMemo, createContext, useContext, useState } from 'react';

import { BurgerMenuButton } from './BurgerMenuButton';

const PageContext = createContext();
export function Page(props) {
	const [border, setBorder] = useState(false);
	return <PageContext.Provider value={[border, setBorder]}>
		<Flex.Container direction='column'>
			<Box is='section' style={useMemo(() => ({ height: '100%' }), [])} {...props} />
		</Flex.Container>
	</PageContext.Provider>;
}

export function PageHeader({ children, title, ...props }) {
	const [border] = useContext(PageContext);
	return <Box style={{ borderBlockEndColor: border ? 'var(--color-gray-lightest)' : 'transparent', transition: 'border-block-end-color 0.3s', borderBlockEnd: '2px solid transparent' }}>
		<Margins all='x16'>
			<Flex.Container wrap='no-wrap' alignItems='center' direction='row'>
				<Box style={{ minHeight: '2.75rem' }} {...props}>
					<Margins inlineEnd='x8'>
						<BurgerMenuButton />
					</Margins>
					<Flex.Item grow={1}>
						<Box is='h1' textStyle='h1' textColor='default'>{title}</Box>
					</Flex.Item>
					{children}
				</Box>
			</Flex.Container>
		</Margins>
	</Box>;
}

export function PageContent(props) {
	const [, setBorder] = useContext(PageContext);
	return <Scrollable onScrollContent={({ top }) => { setBorder(!top); }}>
		<Box style={useMemo(() => ({ padding: '1rem' }), [])} {...props} />
	</Scrollable>;
}

Page.Header = PageHeader;
Page.Content = PageContent;
