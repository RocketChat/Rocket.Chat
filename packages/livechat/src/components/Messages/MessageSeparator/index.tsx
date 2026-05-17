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

const isSameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();


const getDateLabel = (date: string, t: TFunction): string => {
	const messageDate = new Date(date);
	if (isNaN(messageDate.getTime())) {
		return '';
	}
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);


	if (isSameDay(messageDate, today)) return t('Today');
	if (isSameDay(messageDate, yesterday)) return t('Yesterday');

	return t('message_separator_date', {
		val: messageDate,
		formatParams: {
			val: { month: 'short', day: '2-digit', year: 'numeric' },
		},
	}).toUpperCase();
};

// TODO: find a better way to pass `use` and do not default to a string
// eslint-disable-next-line @typescript-eslint/naming-convention
const MessageSeparator = ({ date, unread, use: Element = 'div', className, style = {}, t }: MessageSeparatorProps) => {
	const dateLabel = date ? getDateLabel(date, t) : '';

	return (
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
					{dateLabel || (unread ? t('Unread_Messages') : null)}
				</span>
			)}
			<hr className={createClassName(styles, 'separator__line')} />
		</Element>
	);
};

export default withTranslation()(memo(MessageSeparator));
