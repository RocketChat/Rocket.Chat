import React from 'react';
import { Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import TimeRangeInput from './TimeRangeInput';

const TimeRangeFieldsAssembler = ({ onChange, daysOpen, daysTime, className }) => {
	const t = useTranslation();
	const handleChange = (day) => (start, finish) => onChange({ [day]: { start, finish } });

	return daysOpen.map((day) => <>
		<Field className={className}>
			<Field.Label>
				{t(day)}
			</Field.Label>
			<Field.Row>
				<TimeRangeInput onChange={handleChange(day)} start={daysTime[day]?.start} finish={daysTime[day]?.finish}/>
			</Field.Row>
		</Field>
	</>);
};

export default TimeRangeFieldsAssembler;
