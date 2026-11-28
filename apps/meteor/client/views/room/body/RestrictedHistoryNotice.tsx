import { Bubble } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { withErrorBoundary } from '../../../components/withErrorBoundary';
import MessageListNotice from '../layout/MessageListNotice';

export type RestrictedHistoryNoticeProps = { historyVisibleFrom: Date };

const RestrictedHistoryNotice = ({ historyVisibleFrom }: RestrictedHistoryNoticeProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<MessageListNotice>
			<Bubble role='status' small secondary>
				{t('Messages_before_date_not_available_to_you', { date: formatDateAndTime(historyVisibleFrom) })}
			</Bubble>
		</MessageListNotice>
	);
};

export default withErrorBoundary(RestrictedHistoryNotice);
