import type { ComponentChildren } from 'preact';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type MessageContentProps = {
	reverse?: boolean;
	className?: string;
	style?: React.CSSProperties;
	children?: ComponentChildren;
};

export const MessageContent = memo(({ reverse, className, style = {}, children }: MessageContentProps) => (
	<div className={createClassName(styles, 'message-content', { reverse }, [className])} style={style}>
		{children}
	</div>
));
