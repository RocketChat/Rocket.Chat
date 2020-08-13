import React from 'react';
import { FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSubscription } from 'use-subscription';

import BusinessHourForm from './BusinessHoursForm';
import { formsSubscription } from '../additionalForms';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useForm } from '../../hooks/useForm';
import { businessHourManager } from '../../../app/livechat/client/views/app/business-hours/BusinessHours';

const useChangeHandler = (name, ref) => useMutableCallback((val) => {
	ref.current[name] = { ...ref.current[name], ...val };
});

const getInitalData = ({ workHours }) => ({
	daysOpen: workHours.filter(({ open }) => !!open).map(({ day }) => day),
	daysTime: workHours.reduce((acc, { day, start: { time: start }, finish: { time: finish } }) => {
		acc = { ...acc, [day]: { start, finish } };
		return acc;
	}, {}),
});

const BusinessHoursFormContainer = ({ data, saveRef }) => {
	const forms = useSubscription(formsSubscription);

	const TimezoneForm = forms.useBusinessHoursTimeZone();
	const MultipleBHForm = forms.useBusinessHoursMultiple();

	const showTimezone = useReactiveValue(useMutableCallback(() => businessHourManager.showTimezoneTemplate()));
	const showMultipleBHForm = useReactiveValue(useMutableCallback(() => businessHourManager.showCustomTemplate(data)));

	const onChangeTimezone = useChangeHandler('timezone', saveRef);
	const onChangeMultipleBHForm = useChangeHandler('multiple', saveRef);

	const { values, handlers } = useForm(getInitalData(data));

	saveRef.current.form = values;

	return <FieldGroup>
		{showMultipleBHForm && MultipleBHForm && <MultipleBHForm onChange={onChangeMultipleBHForm} data={data}/>}
		{showTimezone && TimezoneForm && <TimezoneForm onChange={onChangeTimezone} data={data?.timezone?.name}/>}
		<BusinessHourForm values={values} handlers={handlers}/>
	</FieldGroup>;
};

export default BusinessHoursFormContainer;
