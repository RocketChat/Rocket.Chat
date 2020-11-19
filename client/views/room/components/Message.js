import React from 'react';
import { Box, Margins, Skeleton } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

export const MessageSkeleton = React.memo(function MessageSkeleton(props) {
	return <Message {...props}>
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
	</Message>;
});

export function Container({ children, ...props }) {
	return <Box rcx-message__container display='flex' mi='x4' flexDirection='column' {...props}><Margins block='x2'>{children}</Margins></Box>;
}

export function Header({ children }) {
	return <Box rcx-message__header display='flex' flexGrow={0} flexShrink={1} withTruncatedText><Box mi='neg-x2' display='flex' flexDirection='row' alignItems='baseline' withTruncatedText flexGrow={1} flexShrink={1}><Margins inline='x2'> {children} </Margins></Box></Box>;
}

export function Username(props) {
	return <Box rcx-message__username color='neutral-800' fontSize='x14' fontWeight='600' flexShrink={1} withTruncatedText {...props}/>;
}

export function Timestamp({ ts }) {
	return <Box rcx-message__time fontSize='c1' color='neutral-600' flexShrink={0} withTruncatedText>{ts.toDateString ? ts.toDateString() : ts }</Box>;
}

function isIterable(obj) {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}

export function Message({ className, ...props }) {
	return <Box rcx-contextual-message pi='x20' pb='x16' pbs='x16' display='flex' {...props} className={[...isIterable(className) ? className : [className]].filter(Boolean)}/>;
}

export default Message;

const style = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

export function BodyClamp({ className, ...props }) {
	return <Box rcx-message__body className={[...isIterable(className) ? className : [className], style].filter(Boolean)} flexShrink={1} lineHeight='1.45' minHeight='40px' {...props}/>;
}
