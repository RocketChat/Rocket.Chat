import type { HTMLAttributes, RefAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

function MessageNameContainer({ className, ...props }: MessageNameContainerProps) {
	return (
		<span
			className={`${className ?? 'rcx-message-header__name-container'} ${styles.nameContainer({ button: props.role === 'button' })}`}
			{...props}
		/>
	);
}

export default markStaticComponent(MessageNameContainer);
