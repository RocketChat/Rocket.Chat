import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type MessageContentProps = {
	reverse?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
};

export const MessageContent = memo(({ reverse, className, style = {}, children }: MessageContentProps) => (
	<div className={createClassName(styles, 'message-content', { reverse }, [className])} style={style}>
		{children}
	</div>
));
