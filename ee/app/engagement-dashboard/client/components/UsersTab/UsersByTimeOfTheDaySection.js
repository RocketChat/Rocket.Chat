import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { HeatMap } from '../data/HeatMap';
import { Section } from '../Section';
import { useEndpointData } from '../../hooks/useEndpointData';

export function UsersByTimeOfTheDaySection() {
	const t = useTranslation();

	const params = useMemo(() => ({ start: moment().subtract(20, 'days').toISOString() }), []);
	const data = useEndpointData('GET', 'engagement-dashboard/users/users-by-time-of-the-day-in-a-week', params);

	const [keys, values] = useMemo(() => {
		if (!data) {
			return [];
		}

		const keysSet = new Set();

		for (const { day, month, year } of data.week) {
			const key = moment.utc([year, month - 1, day, 0, 0, 0]).toISOString();
			keysSet.add(key);
		}

		const keyFormat = keysSet.size === 7 ? 'dddd' : 'L';
		keysSet.clear();

		const valuesMap = new Map();

		for (const { users, hour, day, month, year } of data.week) {
			const value = valuesMap.get(hour) || { hour };
			const key = moment.utc([year, month - 1, day, 0, 0, 0]).format(keyFormat);
			value[key] = users;
			keysSet.add(key);
			valuesMap.set(hour, value);
		}

		return [
			Array.from(keysSet),
			Array.from(valuesMap.values()),
		];
	}, [data]);

	console.log(data);
	console.log(keys);
	console.log(values);

	return <Section title={t('Users by time of day')} filter={null}>
		<Flex.Container>
			{data
				? <Box style={{ height: 696 }}>
					<HeatMap
						keys={keys}
						indexBy='hour'
						values={values}
					/>
				</Box>
				: <Skeleton variant='rect' height={696} />}
		</Flex.Container>
	</Section>;
}
