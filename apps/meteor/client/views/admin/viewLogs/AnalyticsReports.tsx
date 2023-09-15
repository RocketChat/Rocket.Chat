import type { IStats, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { Trans } from 'react-i18next';

const AnalyticsReports = ({ analytics }: { analytics: Serialized<IStats> }) => {
	const t = useTranslation();

	return (
		<>
			<Box p={20} pbe={28} mbe={24}>
				<Box display='flex' flexDirection='row' alignItems='center' mbe={20}>
					<Box display='flex' justifyContent='center' alignItems='center' borderRadius={2} p={4} mie={8} bg='status-background-info'>
						<Icon name='info' size={20} color='info' />
					</Box>
					<Box fontScale='h4'>{t('How_and_why_we_collect_usage_data')}</Box>
				</Box>
				<Box>
					<Trans i18nKey='analytics.page.bySending'>
						By sending your statistics, you'll help us identify how many instances of
						<Link href='https://rocket.chat/' target='_blank' rel='noopener noreferrer'>
							Rocket.Chat
						</Link>
						are deployed, as well as how good the system is behaving, so we can further improve it. Don't worry, as no user information is
						sent and all the information we receive is kept confidential.
					</Trans>
				</Box>
			</Box>
			<Box display='flex' flexDirection='column' padding={8} flexGrow={1} color='default' bg='neutral' borderRadius='x4' overflow='scroll'>
				<pre>{JSON.stringify(analytics, null, '\t')}</pre>
			</Box>
		</>
	);
};

export default AnalyticsReports;
