import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageNameProps = HTMLAttributes<HTMLSpanElement>;

const MessageName = ({ className, ...props }: MessageNameProps) => (
	<span className={`${className ?? 'rcx-message-header__name'} ${styles.name}`} {...props} />
);

export default markStaticComponent(MessageName);
