import { parseISO, isToday } from 'date-fns';
import type { TFunction } from 'i18next';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

const parseDate = (ts: number, t: TFunction) => {
	const timestamp = new Date(ts).toISOString();
	return t('message_time', {
		val: new Date(timestamp),
		formatParams: {
			val: isToday(parseISO(timestamp)) ? { hour: 'numeric', minute: 'numeric' } : { day: 'numeric', hour: 'numeric', minute: 'numeric' },
		},
	});
};

type MessageTimeProps = {
	ts: number;
	normal?: boolean;
	inverted?: boolean;
	className?: string;
	style?: CSSProperties;
	t: TFunction;
};
const MessageTime = ({ ts, normal, inverted, className, style = {}, t }: MessageTimeProps) => {
	return (
		<div className={createClassName(styles, 'message-time-wrapper')}>
			<time
				dateTime={new Date(ts).toISOString()}
				className={createClassName(styles, 'message-time', { normal, inverted }, [className])}
				style={style}
			>
				{parseDate(ts, t)}
			</time>
		</div>
	);
};

export default withTranslation()(memo(MessageTime));
