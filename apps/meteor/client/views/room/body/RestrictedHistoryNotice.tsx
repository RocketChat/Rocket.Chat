import { Box, Bubble } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { withErrorBoundary } from '../../../components/withErrorBoundary';
import { useFormatDate } from '../../../hooks/useFormatDate';

export type RestrictedHistoryNoticeProps = { historyVisibleFrom: Date };

const RestrictedHistoryNotice = ({ historyVisibleFrom }: RestrictedHistoryNoticeProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<Box display='flex' justifyContent='center' paddingInline={20} marginBlock={8}>
			<Bubble role='status' small secondary>
				{t('Messages_before_date_not_available_to_you', { date: formatDate(historyVisibleFrom) })}
			</Bubble>
		</Box>
	);
};

export default withErrorBoundary(RestrictedHistoryNotice);
