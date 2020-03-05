import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { LegendSymbol } from '../data/LegendSymbol';
import { StreamGraph } from '../data/StreamGraph';
import { useEndpointData } from '../../hooks/useEndpointData';
import { Section } from '../Section';
import { monochromaticColors } from '../data/colors';

export function ActiveUsersSection() {
	const t = useTranslation();

	const overviewParams = useMemo(() => ({
		start: moment().toISOString(),
	}), []);

	const streamParams = useMemo(() => ({
		start: moment().toISOString(),
	}), []);

	const overviewData = useEndpointData('GET', 'engagement-dashboard/users/active-users/overview', overviewParams);
	const streamData = useEndpointData('GET', 'engagement-dashboard/users/active-users/monthly-data', streamParams);

	return <Section title={t('Active users')} filter={null}>
		<CounterSet
			counters={[
				{
					count: overviewData ? overviewData.daily.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? overviewData.daily.diffFromYesterday : 0,
					description: <><LegendSymbol color={monochromaticColors[1]} /> {t('Daily Active Users')}</>,
				},
				{
					count: overviewData ? overviewData.week.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? overviewData.week.differFromLastWeek : 0,
					description: <><LegendSymbol color={monochromaticColors[3]} /> {t('Weekly Active Users')}</>,
				},
				{
					count: overviewData ? overviewData.daily.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					description: <><LegendSymbol color={monochromaticColors[5]} /> {t('Monthly Active Users')}</>,
				},
			]}
		/>
		<Flex.Container>
			{streamData
				? <Box style={{ height: 240 }}>
					<StreamGraph
						lastDate={new Date()}
						series={{
							[t('Daily Active Users')]: Array.from({ length: 21 }, () => Math.round(200 + 80 * Math.random())),
							[t('Weekly Active Users')]: Array.from({ length: 21 }, () => Math.round(220 + 80 * Math.random())),
							[t('Monthly Active Users')]: Array.from({ length: 21 }, () => Math.round(240 + 80 * Math.random())),
						}}
					/>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
