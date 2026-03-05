import type { CSSProperties } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type TypingDotsProps = {
	text: string;
	className?: string;
	style?: CSSProperties;
};

export const TypingDots = ({ text, className, style = {} }: TypingDotsProps) => (
	<div role='status' aria-label={text} className={createClassName(styles, 'typing-dots', {}, [className])} style={style}>
		<span className={createClassName(styles, 'typing-dots__dot')} />
		<span className={createClassName(styles, 'typing-dots__dot')} />
		<span className={createClassName(styles, 'typing-dots__dot')} />
	</div>
);
