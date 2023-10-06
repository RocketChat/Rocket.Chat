import { Box, Icon, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useAnalyticsObject } from './hooks/useAnalyticsObject';

const AnalyticsReports = () => {
	const t = useTranslation();

	const { data, isLoading, isSuccess, isError } = useAnalyticsObject();

	return (
		<>
			<Box p={20} pbe={28} mbe={24}>
				<Box display='flex' flexDirection='row' alignItems='center' mbe={20}>
					<Box display='flex' justifyContent='center' alignItems='center' borderRadius={2} p={4} mie={8} bg='status-background-info'>
						<Icon name='info' size={20} color='info' />
					</Box>
					<Box fontScale='h4'>{t('How_and_why_we_collect_usage_data')}</Box>
				</Box>
				<Box fontScale='p1'>{t('Analytics_page_briefing')}</Box>
			</Box>
			<Box display='flex' flexDirection='column' padding={8} flexGrow={1} color='default' bg='neutral' borderRadius={4} overflow='scroll'>
				{isSuccess && <pre>{JSON.stringify(data, null, '\t')}</pre>}
				{isError && t('Something_went_wrong_try_again_later')}
				{isLoading && (
					<>
						<Skeleton />
						<Skeleton />
						<Skeleton />
					</>
				)}
			</Box>
		</>
	);
};

export default AnalyticsReports;
