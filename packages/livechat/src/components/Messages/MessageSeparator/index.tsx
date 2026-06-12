import { isToday, isYesterday } from 'date-fns';
import type { TFunction } from 'i18next';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type MessageSeparatorProps = {
	date?: string;
	unread?: boolean;
	className?: string;
	style?: CSSProperties;
	t: TFunction;
	use?: any;
};

const formatDateLabel = (date: string, t: TFunction): string => {
	const d = new Date(date);
	if (isToday(d)) return t('today').toUpperCase();
	if (isYesterday(d)) return t('yesterday').toUpperCase();
	return t('message_separator_date', {
		val: d,
		formatParams: { val: { month: 'short', day: '2-digit', year: 'numeric' } },
	}).toUpperCase();
};

// TODO: find a better way to pass `use` and do not default to a string
// eslint-disable-next-line @typescript-eslint/naming-convention
const MessageSeparator = ({ date, unread, use: Element = 'div', className, style = {}, t }: MessageSeparatorProps) => (
	<Element
		className={createClassName(
			styles,
			'separator',
			{
				date: !!date && !unread,
				unread: !date && !!unread,
			},
			[className],
		)}
		style={style}
	>
		<hr className={createClassName(styles, 'separator__line')} />
		{(date || unread) && (
			<span className={createClassName(styles, 'separator__text')}>
				{(!!date && formatDateLabel(date, t)) || (unread && t('unread_messages'))}
			</span>
		)}
		<hr className={createClassName(styles, 'separator__line')} />
	</Element>
);

export default withTranslation()(memo(MessageSeparator));
