import { Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useForm } from '../../../../client/hooks/useForm';
import BusinessHoursMultiple from './BusinessHoursMultiple';

const mapDepartments = (departments) =>
	departments.map(({ _id, name }) => ({ value: _id, label: name }));

const getInitialData = (data = {}) => ({
	active: data.active ?? true,
	name: data.name ?? '',
	departments: mapDepartments(data.departments),
});

const BusinessHoursMultipleContainer = ({
	onChange,
	data: initialData,
	className,
	hasChangesAndIsValid = () => {},
}) => {
	const onlyMyDepartments = true;
	const params = useMemo(() => ({ onlyMyDepartments }), [onlyMyDepartments]);

	const { value: data, phase: state } = useEndpointData('livechat/department', params);

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(initialData));

	const { name } = values;

	onChange(values);
	hasChangesAndIsValid(hasUnsavedChanges && !!name);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<>
				<Skeleton />
				<Skeleton />
				<Skeleton />
			</>
		);
	}

	return <BusinessHoursMultiple values={values} handlers={handlers} className={className} />;
};

export default BusinessHoursMultipleContainer;
