import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageHeaderProps = HTMLAttributes<HTMLDivElement>;

const MessageHeader = ({ children, className, ...props }: MessageHeaderProps) => (
	<div className={`${className ?? 'rcx-message-header'} ${styles.header}`} {...props}>
		<div className={`rcx-message-header__wrapper ${styles.headerWrapper}`}>{children}</div>
	</div>
);

export default markStaticComponent(MessageHeader);
