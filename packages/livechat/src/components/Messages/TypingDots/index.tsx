import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type TypingDotsProps = {
	text: string;
	className?: string;
	style?: React.CSSProperties;
};

export const TypingDots = ({ text, className, style = {} }: TypingDotsProps) => (
	<div aria-label={text} className={createClassName(styles, 'typing-dots', {}, [className])} style={style}>
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
	</div>
);
