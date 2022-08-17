import { withTranslation } from 'react-i18next';

import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';


const MessageSeparator = memo(({
	date,
	unread,
	use: Element = 'div',
	className,
	style = {},
	t,
}) => (
	<Element
		className={createClassName(styles, 'separator', {
			date: !!date && !unread,
			unread: !date && !!unread,
		}, [className])}
		style={style}
	>
		<hr className={createClassName(styles, 'separator__line')} />
		{(date || unread) && (
			<span className={createClassName(styles, 'separator__text')}>
				{
					(!!date && t('message_separator_date', {
						val: new Date(date),
						formatParams: {
							val: { month: 'short', day: '2-digit', year: 'numeric' },
						},
					}).toUpperCase())
					|| (unread && t('unread_messages'))
				}
			</span>
		)}
		<hr className={createClassName(styles, 'separator__line')} />
	</Element>
));

export default withTranslation()(MessageSeparator);
