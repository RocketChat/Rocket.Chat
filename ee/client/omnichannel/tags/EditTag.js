import React, { useMemo } from 'react';
import { Field, TextInput, Button, Margins, Box, MultiSelect, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../../../client/hooks/useForm';
import { useRoute } from '../../../../client/contexts/RouterContext';


export function TagEditWithData({ tagId, reload }) {
	const query = useMemo(() => ({ tagId }), [tagId]);
	const { data, state, error } = useEndpointDataExperimental('livechat/tags.getOne', query);
	const { data: availableDepartments, state: availableDepartmentsState, error: availableDepartmentsError } = useEndpointDataExperimental('livechat/department');

	const t = useTranslation();

	if ([state, availableDepartmentsState].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || availableDepartmentsError) {
		return <Callout m='x16' type='danger'>{t('Not_Available')}</Callout>;
	}

	return <TagEdit tagId={tagId} data={data} availableDepartments={availableDepartments} reload={reload}/>;
}

export function TagNew({ reload }) {
	const t = useTranslation();

	const { data: availableDepartments, state: availableDepartmentsState, error: availableDepartmentsError } = useEndpointDataExperimental('livechat/department');

	if (availableDepartmentsState === ENDPOINT_STATES.LOADING) {
		return <FormSkeleton/>;
	}

	if (availableDepartmentsError) {
		return <Box mbs='x16'>{t('Not_found')}</Box>;
	}

	return <TagEdit reload={reload} isNew availableDepartments={availableDepartments}/>;
}

export function TagEdit({ data, tagId, isNew, availableDepartments, reload, ...props }) {
	const t = useTranslation();
	const tagsRoute = useRoute('omnichannel-tags');

	const tag = data || {};

	const options = useMemo(() => (availableDepartments && availableDepartments.departments ? availableDepartments.departments.map(({ _id, name }) => [_id, name || _id]) : []), [availableDepartments]);

	const { values, handlers, hasUnsavedChanges } = useForm({ name: tag.name, description: tag.description, departments: tag.departments });

	const {
		handleName,
		handleDescription,
		handleDepartments,
	} = handlers;
	const {
		name,
		description,
		departments,
	} = values;

	const nameError = useMemo(() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined), [name, t]);
	const descriptionError = useMemo(() => (!description || description.length === 0 ? t('The_field_is_required', 'description') : undefined), [description, t]);
	const departmentError = useMemo(() => (!departments || departments.length === 0 ? t('The_field_is_required', 'departments') : undefined), [departments, t]);

	const saveTag = useMethod('livechat:saveTag');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const canSave = useMemo(() => !nameError && !descriptionError && !departmentError, [nameError, descriptionError, departmentError]);

	const handleSave = useMutableCallback(async () => {
		const tagData = { name, description };

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		try {
			await saveTag(tagId, tagData, departments);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			reload();
			tagsRoute.push({});
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
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={description} onChange={handleDescription} error={hasUnsavedChanges && descriptionError} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Departments')}</Field.Label>
			<Field.Row>
				<MultiSelect options={options} value={departments} error={hasUnsavedChanges && departmentError} maxWidth='100%' placeholder={t('Select_an_option')} onChange={handleDepartments} flexGrow={1}/>
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
