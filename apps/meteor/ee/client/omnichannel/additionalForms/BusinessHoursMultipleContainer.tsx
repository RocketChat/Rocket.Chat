import type { ILivechatBusinessHour, ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import React from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import BusinessHoursMultiple from './BusinessHoursMultiple';

type Props = {
	onChange: (val: any) => void;
	data: Serialized<ILivechatBusinessHour>;
	hasChangesAndIsValid: (_val: any) => void;
	className?: string;
};

const mapDepartments = (departments: Serialized<ILivechatDepartment[]> | undefined) =>
	departments?.map(({ _id, name }) => ({ value: _id, label: name }));

const getInitialData = (data: Serialized<ILivechatBusinessHour> | Record<string, never> = {}) => ({
	active: data?.active ?? true,
	name: data?.name ?? '',
	departments: mapDepartments(data?.departments),
});

const BusinessHoursMultipleContainer = ({ onChange, data: initialData, className, hasChangesAndIsValid = (_val) => undefined }: Props) => {
	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(initialData));

	const { name } = values;

	onChange(values);
	hasChangesAndIsValid(hasUnsavedChanges && !!name);

	return <BusinessHoursMultiple values={values} handlers={handlers} className={className} />;
};

export default BusinessHoursMultipleContainer;
