import { Field, MultiSelect } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import TimeRangeFieldsAssembler from './TimeRangeFieldsAssembler';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BusinessHoursForm = ({ values, handlers, className = undefined }) => {
	const t = useTranslation();

	const daysOptions = useMemo(() => DAYS_OF_WEEK.map((day) => [day, t(day)]), [t]);

	const { daysOpen, daysTime } = values;

	const { handleDaysOpen, handleDaysTime } = handlers;

	return (
		<>
			<Field className={className}>
				<Field.Label>{t('Open_days_of_the_week')}</Field.Label>
				<Field.Row>
					<MultiSelect options={daysOptions} onChange={handleDaysOpen} value={daysOpen} placeholder={t('Select_an_option')} w='full' />
				</Field.Row>
			</Field>
			<TimeRangeFieldsAssembler onChange={handleDaysTime} daysOpen={daysOpen} daysTime={daysTime} className={className} />
		</>
	);
};

export default BusinessHoursForm;
