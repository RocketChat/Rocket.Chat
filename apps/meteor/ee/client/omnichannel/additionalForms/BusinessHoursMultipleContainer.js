import React from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import BusinessHoursMultiple from './BusinessHoursMultiple';

const mapDepartments = (departments) => departments.map(({ _id, name }) => ({ value: _id, label: name }));

const getInitialData = (data = {}) => ({
	active: data.active ?? true,
	name: data.name ?? '',
	departments: mapDepartments(data.departments),
});

const BusinessHoursMultipleContainer = ({ onChange, data: initialData, className, hasChangesAndIsValid = () => {} }) => {
	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(initialData));

	const { name } = values;

	onChange(values);
	hasChangesAndIsValid(hasUnsavedChanges && !!name);

	return <BusinessHoursMultiple values={values} handlers={handlers} className={className} />;
};

export default BusinessHoursMultipleContainer;
