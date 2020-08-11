import React, { useMemo } from 'react';
import { Field, MultiSelect, FieldGroup } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import TimeRangeFieldsAssembler from './TimeRangeFieldsAssembler';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BusinessHoursForm = ({ values, handlers }) => {
	const t = useTranslation();

	const daysOptions = useMemo(() => DAYS_OF_WEEK.map((day) => [day, t(day)]), [t]);

	const {
		daysOpen,
		daysTime,
	} = values;

	const {
		handleDaysOpen,
		handleDaysTime,
	} = handlers;

	return <FieldGroup>
		<Field>
			<Field.Label>
				{t('Open_days_of_the_week')}
			</Field.Label>
			<Field.Row>
				<MultiSelect options={daysOptions} onChange={handleDaysOpen} value={daysOpen} placeholder={t('Select_an_option')}/>
			</Field.Row>
		</Field>
		<TimeRangeFieldsAssembler onChange={handleDaysTime} daysOpen={daysOpen} daysTime={daysTime}/>
	</FieldGroup>;
};

export default BusinessHoursForm;
