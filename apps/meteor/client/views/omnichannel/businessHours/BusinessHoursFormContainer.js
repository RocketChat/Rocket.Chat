import { FieldGroup, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useState } from 'react';
import { useSubscription } from 'use-subscription';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { useForm } from '../../../hooks/useForm';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { formsSubscription } from '../additionalForms';
import BusinessHourForm from './BusinessHoursForm';

const useChangeHandler = (name, ref) =>
	useMutableCallback((val) => {
		ref.current[name] = { ...ref.current[name], ...val };
	});

const getInitalData = ({ workHours }) => ({
	daysOpen: workHours.filter(({ open }) => !!open).map(({ day }) => day),
	daysTime: workHours.reduce((acc, { day, start: { time: start }, finish: { time: finish } }) => {
		acc = { ...acc, [day]: { start, finish } };
		return acc;
	}, {}),
});

const cleanFunc = () => {};

const BusinessHoursFormContainer = ({ data, saveRef, onChange = () => {} }) => {
	const forms = useSubscription(formsSubscription);

	const [hasChangesMultiple, setHasChangesMultiple] = useState(false);
	const [hasChangesTimeZone, setHasChangesTimeZone] = useState(false);

	const { useBusinessHoursTimeZone = cleanFunc, useBusinessHoursMultiple = cleanFunc } = forms;

	const TimezoneForm = useBusinessHoursTimeZone();
	const MultipleBHForm = useBusinessHoursMultiple();

	const showTimezone = useReactiveValue(useMutableCallback(() => businessHourManager.showTimezoneTemplate()));
	const showMultipleBHForm = useReactiveValue(useMutableCallback(() => businessHourManager.showCustomTemplate(data)));

	const onChangeTimezone = useChangeHandler('timezone', saveRef);
	const onChangeMultipleBHForm = useChangeHandler('multiple', saveRef);

	const { values, handlers, hasUnsavedChanges } = useForm(getInitalData(data));

	saveRef.current.form = values;

	useEffect(() => {
		onChange(hasUnsavedChanges || (showMultipleBHForm && hasChangesMultiple) || (showTimezone && hasChangesTimeZone));
	});

	return (
		<Box maxWidth='600px' w='full' alignSelf='center'>
			<FieldGroup>
				{showMultipleBHForm && MultipleBHForm && (
					<MultipleBHForm onChange={onChangeMultipleBHForm} data={data} hasChangesAndIsValid={setHasChangesMultiple} />
				)}
				{showTimezone && TimezoneForm && (
					<TimezoneForm onChange={onChangeTimezone} data={data?.timezone?.name ?? data?.timezoneName} hasChanges={setHasChangesTimeZone} />
				)}
				<BusinessHourForm values={values} handlers={handlers} />
			</FieldGroup>
		</Box>
	);
};

export default BusinessHoursFormContainer;
