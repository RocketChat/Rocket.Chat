import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

const MessageTimestamp = ({ className, ...props }: MessageTimestampProps) => (
	<span className={`${className ?? 'rcx-message-header__time'} ${styles.timestamp}`} {...props} />
);

export default markStaticComponent(MessageTimestamp);
