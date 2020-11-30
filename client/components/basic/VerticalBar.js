import { Box, Button, Icon, Margins, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useLayoutContextualBarPosition, useLayoutSizes } from '../../providers/LayoutProvider';
import Page from './Page';


function VerticalBar({ children, ...props }) {
	const sizes = useLayoutSizes();
	const position = useLayoutContextualBarPosition();
	return <Box
		rcx-vertical-bar
		backgroundColor='surface'
		display='flex'
		flexDirection='column'
		flexShrink={0}
		width={sizes.contextualBar}
		borderInlineStartWidth='2px'
		borderInlineStartColor='neutral-300'
		borderInlineStartStyle='solid'
		height='full'
		position={position}
		zIndex={5}
		insetInlineEnd={'none'}
		insetBlockStart={'none'}
		{...props}
	>
		{children}
	</Box>;
}

function VerticalBarHeader({ children, ...props }) {
	return <Box
		minHeight='56px'
		maxHeight='56px'
		is='h3'
		pi='x24'
		display='flex'
		alignItems='center'
		justifyContent='space-between'
		borderBlockColor='neutral-200'
		borderBlockEndWidth='x2'
		fontScale='s2'
		color='neutral-800'
		{...props}
	>
		<Margins inline='x4'>{children}</Margins>
	</Box>;
}

function VerticalBarIcon(props) {
	return <Icon {...props} size='x22'/>;
}

function VerticalBarClose(props) {
	const t = useTranslation();
	return <VerticalBarAction {...props} title={t('Close')} name='cross' />;
}

const VerticalBarContent = React.forwardRef(function VerticalBarContent(props, ref) {
	return <Page.Content {...props} ref={ref}/>;
});

const VerticalBarScrollableContent = React.forwardRef(function VerticalBarScrollableContent({ children, ...props }, ref) {
	return <Page.ScrollableContent p='x24' {...props} ref={ref}>
		<Margins blockEnd='x16'>{children}</Margins>
	</Page.ScrollableContent>;
});

const VerticalBarFooter = React.forwardRef(function VerticalBarScrollableContent({ children, ...props }, ref) {
	return <Box is='footer' p='x24' {...props} ref={ref}>
		<Margins blockEnd='x16'>{children}</Margins>
	</Box>;
});

function VerticalBarButton(props) {
	return <Button small square flexShrink={0} ghost {...props}/>;
}

function VerticalBarAction({ name, ...props }) {
	return <VerticalBarButton small square flexShrink={0} ghost {...props}><VerticalBarIcon name={name}/></VerticalBarButton>;
}

function VerticalBarActionBack(props) {
	return <VerticalBarAction {...props} name='arrow-back' />;
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

function VerticalBarText(props) {
	return <Box flexShrink={1} flexGrow={1} withTruncatedText {...props}/>;
}

VerticalBar.Icon = React.memo(VerticalBarIcon);
VerticalBar.Footer = React.memo(VerticalBarFooter);
VerticalBar.Text = React.memo(VerticalBarText);
VerticalBar.Action = React.memo(VerticalBarAction);
VerticalBar.Header = React.memo(VerticalBarHeader);
VerticalBar.Close = React.memo(VerticalBarClose);
VerticalBar.Content = React.memo(VerticalBarContent);
VerticalBar.ScrollableContent = React.memo(VerticalBarScrollableContent);
VerticalBar.Skeleton = React.memo(VerticalBarSkeleton);
VerticalBar.Button = React.memo(VerticalBarButton);
VerticalBar.Back = React.memo(VerticalBarActionBack);


export default VerticalBar;
