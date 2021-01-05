import React, { useMemo } from 'react';
import { Field, TextInput, ToggleSwitch, MultiSelectFiltered, Box, Skeleton } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';

const mapDepartments = (departments) => departments.map(({ _id }) => _id);

const getInitialData = (data = {}) => ({
	active: data.active ?? true,
	name: data.name ?? '',
	departments: mapDepartments(data.departments),
});

const BusinessHoursMultipleContainer = ({ onChange, data: initialData, className, hasChangesAndIsValid = () => {} }) => {
	const { value: data, phase: state } = useEndpointData('livechat/department');

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialData(initialData));

	const { name } = values;

	onChange(values);
	hasChangesAndIsValid(hasUnsavedChanges && !!name);

	const departmentList = useMemo(() => data && data.departments?.map(({ _id, name }) => [_id, name]), [data]);

	if (state === AsyncStatePhase.LOADING) {
		return <>
			<Skeleton />
			<Skeleton />
			<Skeleton />
		</>;
	}

	return <BusinessHoursMultiple values={values} handlers={handlers} departmentList={departmentList} className={className}/>;
};

export const BusinessHoursMultiple = ({ values = {}, handlers = {}, className, departmentList = [] }) => {
	const t = useTranslation();

	const {
		active,
		name,
		departments,
	} = values;

	const {
		handleActive,
		handleName,
		handleDepartments,
	} = handlers;

	return <>
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label>{t('Enabled')}</Field.Label>
				<Field.Row>
					<ToggleSwitch checked={active} onChange={handleActive}/>
				</Field.Row>
			</Box>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Name')}*</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={handleName} placeholder={t('Name')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Departments')}</Field.Label>
			<Field.Row>
				<MultiSelectFiltered options={departmentList} value={departments} onChange={handleDepartments} maxWidth='100%' placeholder={t('Departments')}/>
			</Field.Row>
		</Field>
	</>;
};

export default BusinessHoursMultipleContainer;
