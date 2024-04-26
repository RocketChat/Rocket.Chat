import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

export const MessageBubble = memo(({ inverse, nude, quoted, className, style = {}, children, system = false }) => (
	<div
		data-qa='message-bubble'
		className={createClassName(styles, 'message-bubble', { inverse, nude, quoted, system }, [className])}
		style={style}
	>
		<div className={createClassName(styles, 'message-bubble__inner')}>{children}</div>
	</div>
));
