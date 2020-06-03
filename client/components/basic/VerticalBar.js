import { Box, Button, Icon, Margins, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Page from './Page';

function VerticalBar({ children, ...props }) {
	const mobile = useDebouncedValue(useMediaQuery('(max-width: 420px)'), 50);
	const small = useDebouncedValue(useMediaQuery('(max-width: 780px)'), 50);

	return <Box
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width={mobile ? 'full' : 'x380'}
		height='full'
		position={small ? 'absolute' : undefined}
		insetInlineEnd={small ? 'none' : undefined}
		backgroundColor='white'
		rcx-vertical-bar
		{...props}
	>
		{children}
	</Box>;
}

function VerticalBarHeader(props) {
	return <Box
		pb='x24'
		pi='x24'
		height='64px'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		backgroundColor='white'
		borderBlockColor='neutral-200'
		borderBlockEndWidth='x2'
		fontScale='s2'
		{...props}
	/>;
}

function VerticalBarClose(props) {
	return <Button small flexShrink={0} ghost square {...props}>
		<Icon name='cross' size='x20' />
	</Button>;
}

const VerticalBarContent = React.forwardRef(function VerticalBarContent(props, ref) {
	return <Page.Content {...props} ref={ref}/>;
});

const VerticalBarScrollableContent = React.forwardRef(function VerticalBarScrollableContent({ children, props }, ref) {
	return <Page.ScrollableContent padding='x24' mi='neg-x24' {...props} ref={ref}>
		<Margins blockEnd='x16'>{children}</Margins>
	</Page.ScrollableContent>;
});

export function VerticalBarButton(props) {
	return <Button small square flexShrink={0} ghost {...props}/>;
}

function VerticalBarSkeleton(props) {
	return <VerticalBar { ...props }>
		<VerticalBarHeader><Skeleton width='100%'/></VerticalBarHeader>
		<Box p='x24'>
			<Skeleton width='32px' height='32px' variant='rect'/> <Skeleton />
			{Array(5).fill().map((_, index) => <Skeleton key={index}/>)}
		</Box>
	</VerticalBar>;
}

VerticalBar.Header = VerticalBarHeader;
VerticalBar.Close = VerticalBarClose;
VerticalBar.Content = VerticalBarContent;
VerticalBar.ScrollableContent = VerticalBarScrollableContent;
VerticalBar.Skeleton = VerticalBarSkeleton;
VerticalBar.Button = VerticalBarButton;

export default VerticalBar;
