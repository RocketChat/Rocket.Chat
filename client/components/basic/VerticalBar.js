import { Box, Tile, Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { Page } from './Page';

export function VerticalBar({
	children,
	...props
}) {
	const mobile = useDebouncedValue(useMediaQuery('(max-width: 420px)'), 50);
	const small = useDebouncedValue(useMediaQuery('(max-width: 780px)'), 50);

	return <Box
		display='flex'
		flexShrink={0}
		width={mobile ? 'full' : 'x380'}
		height='full'
		style={{
			...small && {
				position: 'absolute',
				right: '0',
			},
		}}
		{...props}
	>
		<Tile display='flex' flexDirection='column' flexGrow={1} padding={0} m={0} children={children} />
	</Box>;
}

export function VerticalBarHeader(props) {
	return <Box backgroundColor='neutral-100' textStyle='s2' pb='x32' pi='x24' display='flex' alignItems='center' justifyContent='space-between' {...props} />;
}

export function VerticalBarClose(props) {
	return <Button small flexShrink={0} ghost square {...props}>
		<Icon name='cross' size='x20' />
	</Button>;
}

function VerticalBarContent(props) {
	return <Page.Content {...props} />;
}

VerticalBar.Header = VerticalBarHeader;
VerticalBar.Close = VerticalBarClose;
VerticalBar.Content = VerticalBarContent;

export default VerticalBar;
