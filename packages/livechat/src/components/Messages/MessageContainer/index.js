import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';


export const MessageContainer = memo(({
	id,
	compact,
	reverse,
	use: Element = 'div',
	className,
	style = {},
	children,
	system = false,
}) => (
	<Element
		id={id}
		className={createClassName(styles, 'message-container', { compact, reverse, system }, [className])}
		style={style}
	>
		{children}
	</Element>
));
