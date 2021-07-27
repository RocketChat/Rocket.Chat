import { Field } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { DAYS_OF_WEEK } from './BusinessHoursForm';
import TimeRangeInput from './TimeRangeInput';

const TimeRangeFieldsAssembler = ({ onChange, daysOpen, daysTime, className }) => {
	const t = useTranslation();
	const handleChange = (day) => (start, finish) =>
		onChange({ ...daysTime, [day]: { start, finish } });

	const stableDaysOpen = useStableArray(daysOpen);
	const daysList = useMemo(
		() => DAYS_OF_WEEK.filter((day) => stableDaysOpen.includes(day)),
		[stableDaysOpen],
	);

	return (
		<>
			{daysList.map((day) => (
				<Field className={className} key={day}>
					<Field.Label>{t(day)}</Field.Label>
					<Field.Row>
						<TimeRangeInput
							onChange={handleChange(day)}
							start={daysTime[day]?.start}
							finish={daysTime[day]?.finish}
						/>
					</Field.Row>
				</Field>
			))}
		</>
	);
};

export default TimeRangeFieldsAssembler;
