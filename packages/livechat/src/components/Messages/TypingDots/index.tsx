import type { CSSProperties } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type TypingDotsProps = {
	text: string;
	className?: string;
	style?: CSSProperties;
};

export const TypingDots = ({ text, className, style = {} }: TypingDotsProps) => (
	<div aria-label={text} className={createClassName(styles, 'typing-dots', {}, [className])} style={style}>
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
	</div>
);
