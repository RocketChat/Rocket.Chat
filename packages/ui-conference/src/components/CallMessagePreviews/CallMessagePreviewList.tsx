import { Box } from '@rocket.chat/fuselage';
import type { FocusEventHandler, PointerEventHandler, ReactNode } from 'react';

export type CallMessagePreviewListProps = {
	'aria-label': string;
	'children': ReactNode;
	'onPointerEnter'?: PointerEventHandler<HTMLUListElement>;
	'onPointerLeave'?: PointerEventHandler<HTMLUListElement>;
	'onFocus'?: FocusEventHandler<HTMLUListElement>;
	'onBlur'?: FocusEventHandler<HTMLUListElement>;
};

/** The chat messages previewed over the call, newest last. */
const CallMessagePreviewList = ({ children, ...props }: CallMessagePreviewListProps) => (
	<Box is='ul' display='flex' flexDirection='column' gap={8} margin={0} padding={0} {...props}>
		{children}
	</Box>
);

export default CallMessagePreviewList;
