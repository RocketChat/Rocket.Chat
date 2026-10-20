import type { HTMLAttributes } from 'react';

import * as styles from './Message.css';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

type MessageContainerBaseProps = MessageContainerProps & { fixed?: boolean; left?: boolean; rcxClassName: string };

/** The container every message column renders; `fixed` and `left` pick its layout. */
export const MessageContainerBase = ({ fixed, left, rcxClassName, className, ...props }: MessageContainerBaseProps) => (
	<div className={`${className ?? rcxClassName} ${styles.container({ fixed, left })}`} {...props} />
);

const MessageContainer = (props: MessageContainerProps) => <MessageContainerBase rcxClassName='rcx-message-container' {...props} />;

export default markStaticComponent(MessageContainer);
