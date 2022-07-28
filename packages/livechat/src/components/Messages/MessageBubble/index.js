import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';


export const MessageBubble = memo(({
	inverse,
	nude,
	quoted,
	className,
	style = {},
	children,
	system = false,
}) => (
	<div
		className={createClassName(styles, 'message-bubble', { inverse, nude, quoted, system }, [className])}
		style={style}
	>
		<div className={createClassName(styles, 'message-bubble__inner')}>
			{children}
		</div>
	</div>
));
