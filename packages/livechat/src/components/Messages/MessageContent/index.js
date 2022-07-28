import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';


export const MessageContent = memo(({ reverse, className, style = {}, children }) => (
	<div
		className={createClassName(styles, 'message-content', { reverse }, [className])}
		style={style}
	>
		{children}
	</div>
));
