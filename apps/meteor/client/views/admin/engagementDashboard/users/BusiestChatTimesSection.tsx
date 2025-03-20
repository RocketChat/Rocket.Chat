import { Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import EngagementDashboardCardFilter from '../EngagementDashboardCardFilter';
import ContentForDays from './ContentForDays';
import ContentForHours from './ContentForHours';

type TimeUnit = 'hours' | 'days';

type BusiestChatTimesSectionProps = {
	timezone: 'utc' | 'local';
};

const BusiestChatTimesSection = ({ timezone }: BusiestChatTimesSectionProps): ReactElement => {
	const { t } = useTranslation();

	const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours');
	const timeUnitOptions = useMemo<[timeUnit: TimeUnit, label: string][]>(
		() => [
			['hours', t('Hours')],
			['days', t('Days')],
		],
		[t],
	);

	const [displacement, setDisplacement] = useState(0);

	const handleTimeUnitChange = (timeUnit: string): void => {
		setTimeUnit(timeUnit as TimeUnit);
		setDisplacement(0);
	};

	const handlePreviousDateClick = (): void => setDisplacement((displacement) => displacement + 1);
	const handleNextDateClick = (): void => setDisplacement((displacement) => displacement - 1);

	const Content = (
		{
			hours: ContentForHours,
			days: ContentForDays,
		} as const
	)[timeUnit];

	return (
		<>
			<EngagementDashboardCardFilter>
				<Select
					options={timeUnitOptions}
					value={timeUnit}
					onChange={(value) => handleTimeUnitChange(String(value))}
					aria-label={t('Select_period')}
				/>
			</EngagementDashboardCardFilter>
			<Content
				displacement={displacement}
				onPreviousDateClick={handlePreviousDateClick}
				onNextDateClick={handleNextDateClick}
				timezone={timezone}
			/>
		</>
	);
};

export default BusiestChatTimesSection;
