import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageBodyProps = HTMLAttributes<HTMLDivElement> & {
	clamp?: 2 | 3 | 4;
};

const MessageBody = ({ clamp, className, ...props }: MessageBodyProps) => (
	<div
		className={prependClassName(
			className,
			['rcx-message-body', clamp && `rcx-message-body--clamp rcx-message-body--clamp-${clamp}`].filter(Boolean).join(' '),
		)}
		{...props}
	/>
);

export default MessageBody;
