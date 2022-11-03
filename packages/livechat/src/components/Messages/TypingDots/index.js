import { createClassName } from '../../helpers';
import styles from './styles.scss';

export const TypingDots = ({ text, className, style = {} }) => (
	<div aria-label={text} className={createClassName(styles, 'typing-dots', {}, [className])} style={style}>
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
		<span class={createClassName(styles, 'typing-dots__dot')} />
	</div>
);
