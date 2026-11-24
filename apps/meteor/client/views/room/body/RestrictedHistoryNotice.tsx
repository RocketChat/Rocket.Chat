import { Box, Bubble } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { withErrorBoundary } from '../../../components/withErrorBoundary';

export type RestrictedHistoryNoticeProps = { historyVisibleFrom: Date };

const RestrictedHistoryNotice = ({ historyVisibleFrom }: RestrictedHistoryNoticeProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<Box display='flex' justifyContent='center' paddingInline='x20' marginBlock='x8'>
			<Bubble role='status' small secondary>
				{t('Messages_before_date_not_available_to_you', { date: formatDateAndTime(historyVisibleFrom) })}
			</Bubble>
		</Box>
	);
};

export default withErrorBoundary(RestrictedHistoryNotice);
