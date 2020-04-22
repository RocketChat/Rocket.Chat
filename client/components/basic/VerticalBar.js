import { Box, Tile, Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import './VerticalBar.css';

export function VerticalBar({ children, ...props }) {
	return <Box componentClassName='rcx-vertical-bar'{...props} display='flex'><Tile flexGrow={1} flexShrink={1} padding={0} m={0} children={children} {...props} /></Box>;
}

export function VerticalBarHeader({ ...props }) {
	return <Box style={{ background: '#F4F6F9' }} textStyle='s2' pb='x32' pi='x24' display='flex' alignItems='center' justifyContent='space-between' {...props} />;
}

export function VerticalBarButton(props) {
	return <Button small flexShrink={0} ghost {...props}/>;
}


export function VerticalBarClose(props) {
	return <VerticalBarButton {...props}>
		<Icon name='cross' size='x20' />
	</VerticalBarButton>;
}
