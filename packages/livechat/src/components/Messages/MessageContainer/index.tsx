import type { ComponentChildren } from 'preact';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type MessageContainerProps = {
	id?: string;
	compact?: boolean;
	reverse?: boolean;
	use?: any;
	className?: string;
	style?: React.CSSProperties;
	system?: boolean;
	children?: ComponentChildren;
};

export const MessageContainer = memo(
	// TODO: find a better way to pass `use` and do not default to a string
	// eslint-disable-next-line @typescript-eslint/naming-convention
	({ id, compact, reverse, use: Element = 'div', className, style = {}, children, system = false }: MessageContainerProps) => (
		<Element id={id} className={createClassName(styles, 'message-container', { compact, reverse, system }, [className])} style={style}>
			{children}
		</Element>
	),
);
