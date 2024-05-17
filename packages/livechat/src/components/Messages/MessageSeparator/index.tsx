import type { TFunction } from 'i18next';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type MessageSeparatorProps = {
	date?: string;
	unread?: boolean;
	className?: string;
	style?: CSSProperties;
	t: TFunction;
	use?: any;
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
				{(!!date &&
					t('message_separator_date', {
						val: new Date(date),
						formatParams: {
							val: { month: 'short', day: '2-digit', year: 'numeric' },
						},
					}).toUpperCase()) ||
					(unread && t('unread_messages'))}
			</span>
		)}
		<hr className={createClassName(styles, 'separator__line')} />
	</Element>
);

export default withTranslation()(memo(MessageSeparator));
