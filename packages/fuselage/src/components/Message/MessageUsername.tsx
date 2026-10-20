import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

const MessageUsername = ({ className, ...props }: MessageUsernameProps) => (
	<span className={`${className ?? 'rcx-message-header__username'} ${styles.username}`} {...props} />
);

export default markStaticComponent(MessageUsername);
