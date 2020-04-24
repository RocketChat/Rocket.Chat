import { Box, Tile, Button, Icon, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import './VerticalBar.css';

export function VerticalBar({ children, ...props }) {
	return <Box componentClassName='rcx-vertical-bar'{...props} display='flex'><Tile flexGrow={1} flexShrink={1} padding={0} m={0} children={children} {...props} /></Box>;
}

export function VerticalBarHeader({ ...props }) {
	return <Box style={{ background: '#F4F6F9' }} textStyle='s2' pb='x32' pi='x24' display='flex' alignItems='center' justifyContent='space-between' {...props} />;
}

export function VerticalBarButton(props) {
	return <Button small square flexShrink={0} ghost {...props}/>;
}

export function VerticalBarClose(props) {
	return <VerticalBarButton {...props}>
		<Icon name='cross' size='x20' />
	</VerticalBarButton>;
}

export function VerticalBarSkeleton(props) {
	return <VerticalBar { ...props }>
		<VerticalBarHeader><Skeleton width='100%'/></VerticalBarHeader>
		<Box p='x24'>
			<Skeleton width='32px' height='32px' variant='rect'/> <Skeleton />
			{Array(5).fill().map((_, index) => <Skeleton key={index}/>)}
		</Box>
	</VerticalBar>;
}
