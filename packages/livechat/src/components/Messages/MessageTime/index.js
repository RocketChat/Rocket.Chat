import { parseISO } from 'date-fns/fp';
import isToday from 'date-fns/isToday';
import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

const parseDate = (ts, t) => {
	const timestamp = new Date(ts).toISOString();
	return t('message_time', {
		val: new Date(timestamp),
		formatParams: {
			val: isToday(parseISO(timestamp)) ? { hour: 'numeric', minute: 'numeric' } : { day: 'numeric', hour: 'numeric', minute: 'numeric' },
		},
	});
};

const MessageTime = ({ ts, normal, inverted, className, style = {}, t }) => (
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

export default withTranslation()(memo(MessageTime));
