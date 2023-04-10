import type { ILivechatBusinessHour, Serialized } from '@rocket.chat/core-typings';
import { FieldGroup, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useState } from 'react';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { useForm } from '../../../hooks/useForm';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useFormsSubscription } from '../additionalForms';
import BusinessHourForm from './BusinessHoursForm';
import type { BusinessHoursData } from './NewBusinessHoursPage';

type DayTime = { start: string; finish: string };

export type DaysTime = {
	Friday: DayTime;
	Monday: DayTime;
	Saturday: DayTime;
	Sunday: DayTime;
	Thursday: DayTime;
	Tuesday: DayTime;
	Wednesday: DayTime;
};

export type dataType = Serialized<ILivechatBusinessHour> & {
	timezoneName?: string;
};

type FormContainerProps = {
	data: BusinessHoursData;
	saveRef: any;
	onChange: Dispatch<SetStateAction<boolean>>;
};

const useChangeHandler = (
	name: string,
	ref: {
		current: {
			form: { daysOpen: string[]; daysTime: DaysTime };
		};
	},
) =>
	useMutableCallback((val) => {
		ref.current[name as keyof typeof ref.current] = { ...ref.current[name as keyof typeof ref.current], ...val };
	});

const getInitalData = ({ workHours }: BusinessHoursData) => ({
	daysOpen: workHours.filter(({ open }) => !!open).map(({ day }) => day),
	daysTime: workHours.reduce((acc, { day, start: { time: start }, finish: { time: finish } }) => {
		acc = { ...acc, [day]: { start, finish } };
		return acc;
	}, {}),
});

const cleanFunc = () => undefined;

const BusinessHoursFormContainer = ({ data, saveRef, onChange = () => undefined }: FormContainerProps) => {
	const forms = useFormsSubscription();

	const [hasChangesMultiple, setHasChangesMultiple] = useState(false);
	const [hasChangesTimeZone, setHasChangesTimeZone] = useState(false);

	const { useBusinessHoursTimeZone = cleanFunc, useBusinessHoursMultiple = cleanFunc } = forms;

	const TimezoneForm = useBusinessHoursTimeZone();
	const MultipleBHForm = useBusinessHoursMultiple();

	const showTimezone = useReactiveValue(useMutableCallback(() => businessHourManager.showTimezoneTemplate()));
	const showMultipleBHForm = useReactiveValue(
		useMutableCallback(() => businessHourManager.showCustomTemplate(data as unknown as ILivechatBusinessHour)),
	);

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
