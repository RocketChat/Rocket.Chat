import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { MessageContext } from './MessageContext';
import { prependClassName } from '../../helpers/prependClassName';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageBodyProps = HTMLAttributes<HTMLDivElement> & {
	clamp?: 2 | 3 | 4;
};

function MessageBody({ clamp, className, ...props }: MessageBodyProps) {
	const { pending } = MessageContext.useStyledContext();

	return (
		<div
			className={`${prependClassName(
				className,
				['rcx-message-body', clamp && `rcx-message-body--clamp rcx-message-body--clamp-${clamp}`].filter(Boolean).join(' '),
			)} ${styles.body({ pending, clamp })}`}
			{...props}
		/>
	);
}

export default markStaticComponent(MessageBody);
