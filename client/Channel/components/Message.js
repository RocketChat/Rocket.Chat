import React from 'react';
import { Box, Margins, Skeleton } from '@rocket.chat/fuselage';

export function MessageSkeleton(props) {
	return <Box rcx-message pi='x20' pb='x16' pbs='x16' display='flex' {...props}>
		<Container mb='neg-x2'>
			<Skeleton variant='rect' size='x36'/>
		</Container>
		<Container width='1px' mb='neg-x4' flexGrow={1}>
			<Header>
				<Skeleton width='100%'/>
			</Header>
			<BodyClamp><Skeleton /><Skeleton /></BodyClamp>
			<Box mi='neg-x8' flexDirection='row' display='flex' alignItems='baseline' mb='x8'>
				<Margins inline='x4'>
					<Skeleton />
					<Skeleton />
					<Skeleton />
				</Margins>
			</Box>
		</Container>
	</Box>;
}

export function Container({ children, ...props }) {
	return <Box rcx-message__container display='flex' mi='x4' flexDirection='column' {...props}><Margins block='x2'>{children}</Margins></Box>;
}

export function Header({ children }) {
	return <Box rcx-message__header display='flex' flexGrow={0} flexShrink={1} withTruncatedText><Box mi='neg-x2' display='flex' flexDirection='row' alignItems='baseline' withTruncatedText flexGrow={1	} flexShrink={1}><Margins inline='x2'> {children} </Margins></Box></Box>;
}

export function Username(props) {
	return <Box rcx-message__username color='neutral-800' fontSize='x14' fontWeight='600' flexShrink={1} withTruncatedText {...props}/>;
}

export function Timestamp({ ts }) {
	return <Box rcx-message__time fontSize='c1' color='neutral-600' flexShrink={0} withTruncatedText>{ts.toDateString ? ts.toDateString() : ts }</Box>;
}

const style = {
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	wordBreak: 'break-all',
};

export function BodyClamp(props) {
	return <Box rcx-message__body flexShrink={1} style={style} lineHeight='1.45' minHeight='40px' {...props}/>;
}
