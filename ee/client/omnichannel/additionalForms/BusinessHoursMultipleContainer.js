import { Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useForm } from '../../../../client/hooks/useForm';
import BusinessHoursMultiple from './BusinessHoursMultiple';

const mapDepartments = (departments) => departments.map(({ _id }) => _id);

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
	const { value: data, phase: state } = useEndpointData('livechat/department');

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(initialData));

	const { name } = values;

	onChange(values);
	hasChangesAndIsValid(hasUnsavedChanges && !!name);

	const departmentList = useMemo(
		() => data && data.departments?.map(({ _id, name }) => [_id, name]),
		[data],
	);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<>
				<Skeleton />
				<Skeleton />
				<Skeleton />
			</>
		);
	}

	return (
		<BusinessHoursMultiple
			values={values}
			handlers={handlers}
			departmentList={departmentList}
			className={className}
		/>
	);
};

export default BusinessHoursMultipleContainer;
