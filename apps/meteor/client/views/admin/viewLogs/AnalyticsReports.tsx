import { Box, Icon, Skeleton, Scrollable, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../components/MarkdownText';
import { links } from '../../../lib/links';
import { useStatistics } from '../../hooks/useStatistics';

const AnalyticsReports = () => {
	const { t } = useTranslation();

	const { data, isLoading, isSuccess, isError } = useStatistics();

	return (
		<Box display='flex' flexDirection='column' gap={16} overflow='hidden' height='100%'>
			<Callout title={t('Server_logs_access_has_changed_callout_title')}>
				<MarkdownText variant='inline' content={t('Server_logs_access_has_changed_callout_description', { docsUrl: links.go.logsDocs })} />
			</Callout>
			<Box backgroundColor='light' padding='x20' paddingBlockEnd='x24' borderRadius='medium'>
				<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd={20}>
					<Box
						display='flex'
						justifyContent='center'
						alignItems='center'
						borderRadius='small'
						padding={4}
						marginInlineEnd={8}
						backgroundColor='status-background-info'
						color='info'
					>
						<Icon name='info' size={20} />
					</Box>
					<Box fontScale='h4'>{t('How_and_why_we_collect_usage_data')}</Box>
				</Box>
				<Box fontScale='p1' marginBlockEnd={16}>
					{t('Analytics_page_briefing_first_paragraph')}
				</Box>
				<Box fontScale='p1'>{t('Analytics_page_briefing_second_paragraph')}</Box>
			</Box>
			<Scrollable vertical>
				<Box marginBlockEnd={8} padding={8} backgroundColor='neutral' borderRadius='medium' height='100%'>
					{isSuccess && <pre>{JSON.stringify(data, null, '\t')}</pre>}
					{isError && t('Something_went_wrong_try_again_later')}
					{isLoading && Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} />)}
					<></>
				</Box>
			</Scrollable>
		</Box>
	);
};

export default AnalyticsReports;
