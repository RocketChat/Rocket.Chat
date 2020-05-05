import { Box, Tile, Button, Icon, Margins } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Page from './Page';

function VerticalBar({ children, ...props }) {
	const mobile = useDebouncedValue(useMediaQuery('(max-width: 420px)'), 50);
	const small = useDebouncedValue(useMediaQuery('(max-width: 780px)'), 50);

	return <Box
		display='flex'
		flexShrink={0}
		width={mobile ? 'full' : 'x380'}
		height='full'
		position={small ? 'absolute' : undefined}
		insetInlineEnd={small ? 'none' : undefined}
		{...props}
	>
		<Tile
			margin='none'
			padding='none'
			display='flex'
			flexDirection='column'
			flexGrow={1}
		>
			{children}
		</Tile>
	</Box>;
}

function VerticalBarHeader(props) {
	return <Box
		paddingBlock='x32'
		paddingInline='x24'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		backgroundColor='neutral-200'
		fontScale='s2'
		{...props}
	/>;
}

function VerticalBarClose(props) {
	return <Button small flexShrink={0} ghost square {...props}>
		<Icon name='cross' size='x20' />
	</Button>;
}

function VerticalBarContent(props) {
	return <Page.Content {...props} />;
}

function VerticalBarScrollableContent({ children, props }) {
	return <Page.ScrollableContent padding='x24' mi='neg-x24' {...props}>
		<Margins blockEnd='x16'>{children}</Margins>
	</Page.ScrollableContent>;
}

VerticalBar.Header = VerticalBarHeader;
VerticalBar.Close = VerticalBarClose;
VerticalBar.Content = VerticalBarContent;
VerticalBar.ScrollableContent = VerticalBarScrollableContent;

export default VerticalBar;
