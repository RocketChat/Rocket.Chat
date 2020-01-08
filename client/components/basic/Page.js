import { Box, Flex, Margins, Scrollable } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { BurgerMenuButton } from './BurgerMenuButton';

export function Page(props) {
	return <Flex.Container direction='column'>
		<Box is='section' style={useMemo(() => ({ height: '100vh' }), [])} {...props} />
	</Flex.Container>;
}

export function PageHeader({ children, title, ...props }) {
	return <Margins all='16'>
		<Flex.Container wrap='nowrap' alignItems='center'>
			<Box style={{ minHeight: '2.75rem' }} {...props}>
				<Margins inlineEnd='8'>
					<BurgerMenuButton />
				</Margins>
				<Flex.Item grow='1'>
					<Box is='h1' textStyle='h1' textColor='default'>{title}</Box>
				</Flex.Item>
				{children}
			</Box>
		</Flex.Container>
	</Margins>;
}

export function PageContent(props) {
	return <Scrollable>
		<Box style={useMemo(() => ({ padding: '1rem' }), [])} {...props} />
	</Scrollable>;
}

Page.Header = PageHeader;
Page.Content = PageContent;
