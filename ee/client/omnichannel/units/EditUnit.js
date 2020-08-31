import React, { useMemo } from 'react';
import { Field, TextInput, Button, Margins, Box, MultiSelect, Callout, Select } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../../../client/hooks/useForm';
import { useRoute } from '../../../../client/contexts/RouterContext';


export function UnitEditWithData({ unitId, reload }) {
	const query = useMemo(() => ({ unitId }), [unitId]);
	const { data, state, error } = useEndpointDataExperimental('livechat/units.getOne', query);
	const { data: availableDepartments, state: availableDepartmentsState, error: availableDepartmentsError } = useEndpointDataExperimental('livechat/department');
	const { data: availableMonitors, state: availableMonitorsState, error: availableMonitorsError } = useEndpointDataExperimental('livechat/monitors.list');
	const { data: unitMonitors, state: unitMonitorsState, error: unitMonitorsError } = useEndpointDataExperimental('livechat/unitMonitors.list', query);

	const t = useTranslation();

	if ([state, availableDepartmentsState, availableMonitorsState, unitMonitorsState].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || availableDepartmentsError || availableMonitorsError || unitMonitorsError) {
		return <Callout m='x16' type='danger'>{t('Not_Available')}</Callout>;
	}

	return <UnitEdit
		unitId={unitId}
		data={data}
		availableDepartments={availableDepartments}
		availableMonitors={availableMonitors}
		unitMonitors={unitMonitors}
		reload={reload}/>;
}

export function UnitNew({ reload }) {
	const t = useTranslation();

	const { data: availableDepartments, state: availableDepartmentsState, error: availableDepartmentsError } = useEndpointDataExperimental('livechat/department');
	const { data: availableMonitors, state: availableMonitorsState, error: availableMonitorsError } = useEndpointDataExperimental('livechat/monitors.list');

	if ([availableDepartmentsState, availableMonitorsState].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	if (availableDepartmentsError || availableMonitorsError) {
		return <Box mbs='x16'>{t('Not_found')}</Box>;
	}

	return <UnitEdit reload={reload} isNew availableDepartments={availableDepartments} availableMonitors={availableMonitors}/>;
}

export function UnitEdit({ data, unitId, isNew, availableDepartments, availableMonitors, unitMonitors, reload, ...props }) {
	const t = useTranslation();
	const unitsRoute = useRoute('omnichannel-units');

	const unit = data || {};

	const depOptions = useMemo(() => (availableDepartments && availableDepartments.departments ? availableDepartments.departments.map(({ _id, name }) => [_id, name || _id]) : []), [availableDepartments]);
	const monOptions = useMemo(() => (availableMonitors && availableMonitors.monitors ? availableMonitors.monitors.map(({ _id, name }) => [_id, name || _id]) : []), [availableMonitors]);
	const currUnitMonitors = useMemo(() => (unitMonitors && unitMonitors.monitors ? unitMonitors.monitors.map(({ monitorId }) => monitorId) : []), [unitMonitors]);
	const visibilityOpts = [['public', t('Public')], ['private', t('Private')]];
	const unitDepartments = useMemo(() => (availableDepartments && (availableDepartments.departments && unitId) ? availableDepartments.departments.map((department) => {
		let result;
		if (department.parentId === unitId) {
			result = department._id;
		}
		return result;
	}).filter((department) => !!department) : []), [availableDepartments, unitId]);


	const { values, handlers, hasUnsavedChanges } = useForm({ name: unit.name, visibility: unit.visibility, departments: unitDepartments, monitors: currUnitMonitors });

	const {
		handleName,
		handleVisibility,
		handleDepartments,
		handleMonitors,
	} = handlers;
	const {
		name,
		visibility,
		departments,
		monitors,
	} = values;

	const nameError = useMemo(() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined), [name, t]);
	const visibilityError = useMemo(() => (!visibility || visibility.length === 0 ? t('The_field_is_required', 'description') : undefined), [visibility, t]);
	const departmentError = useMemo(() => (!departments || departments.length === 0 ? t('The_field_is_required', 'departments') : undefined), [departments, t]);
	const unitMonitorsError = useMemo(() => (!monitors || monitors.length === 0 ? t('The_field_is_required', 'monitors') : undefined), [monitors, t]);

	const saveUnit = useMethod('livechat:saveUnit');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const canSave = useMemo(() => !nameError && !visibilityError && !departmentError, [nameError, visibilityError, departmentError]);

	const handleSave = useMutableCallback(async () => {
		const unitData = { name, visibility };
		const departmentsData = departments.map((department) => ({ departmentId: department }));
		const monitorsData = monitors.map((monitor) => {
			const monitorInfo = monOptions.find((el) => el[0] === monitor);
			return { monitorId: monitorInfo[0], username: monitorInfo[1] };
		});

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		try {
			await saveUnit(unitId, unitData, monitorsData, departmentsData);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			reload();
			unitsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <VerticalBar.ScrollableContent is='form' { ...props }>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={name} onChange={handleName} error={hasUnsavedChanges && nameError}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Visibility')}</Field.Label>
			<Field.Row>
				<Select options={visibilityOpts} value={visibility} error={hasUnsavedChanges && unitMonitorsError} placeholder={t('Select_an_option')} onChange={handleVisibility} flexGrow={1}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Departments')}</Field.Label>
			<Field.Row>
				<MultiSelect options={depOptions} value={departments} error={hasUnsavedChanges && departmentError} maxWidth='100%' placeholder={t('Select_an_option')} onChange={handleDepartments} flexGrow={1}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Monitors')}</Field.Label>
			<Field.Row>
				<MultiSelect options={monOptions} value={monitors} error={hasUnsavedChanges && unitMonitorsError} maxWidth='100%' placeholder={t('Select_an_option')} onChange={handleMonitors} flexGrow={1}/>
			</Field.Row>
		</Field>

		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					{!isNew && <Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={handleReset}>{t('Reset')}</Button>}
					<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges && !canSave} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
		</Field.Row>
	</VerticalBar.ScrollableContent>;
}
