import React, { useMemo } from 'react';
import { Field, TextInput, Button, Margins, Box, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../../../client/hooks/useForm';
import { useRoute } from '../../../../client/contexts/RouterContext';


export function PriorityEditWithData({ priorityId, reload }) {
	const query = useMemo(() => ({ priorityId }), [priorityId]);
	const { data, state, error } = useEndpointDataExperimental('livechat/priorities.getOne', query);

	const t = useTranslation();

	if (state === ENDPOINT_STATES.LOADING) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('Not_found')}</Box>;
	}

	return <PriorityEdit priorityId={priorityId} data={data} reload={reload}/>;
}

export function PriorityNew({ reload }) {
	return <PriorityEdit reload={reload}/>;
}

export function PriorityEdit({ data, priorityId, reload, ...props }) {
	const t = useTranslation();
	const prioritiesRoute = useRoute('omnichannel-priorities');

	const priority = data || {};

	const { values, handlers, hasUnsavedChanges } = useForm({ name: priority.name, description: priority.description, dueTimeInMinutes: priority.dueTimeInMinutes });

	const {
		handleName,
		handleDescription,
		handleDueTimeInMinutes,
	} = handlers;
	const {
		name,
		description,
		dueTimeInMinutes,
	} = values;

	const nameError = useMemo(() => (!name || name.length === 0 ? t('Empty_fields') : undefined), [name, t]);
	const descriptionError = useMemo(() => (!description || description.length === 0 ? t('Empty_fields') : undefined), [description, t]);
	const dueTimeInMinutesError = useMemo(() => (!dueTimeInMinutes || dueTimeInMinutes <= 0 ? t('Empty_fields') : undefined), [dueTimeInMinutes, t]);

	const savePriority = useMethod('livechat:savePriority');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const canSave = useMemo(() => !nameError && !descriptionError && !dueTimeInMinutesError, [nameError, descriptionError, dueTimeInMinutesError]);

	const handleSave = useMutableCallback(async () => {
		const payload = { name, description, dueTimeInMinutes: `${ dueTimeInMinutes }` };

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('Fill_all_fields') });
		}

		try {
			await savePriority(priorityId, payload);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			reload();
			prioritiesRoute.push({});
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
			<Field.Label>{t('Estimated_due_time_in_minutes')}</Field.Label>
			<Field.Row>
				<NumberInput value={dueTimeInMinutes} onChange={handleDueTimeInMinutes} flexGrow={1} error={hasUnsavedChanges && dueTimeInMinutesError}/>
			</Field.Row>
		</Field>

		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={handleReset}>{t('Reset')}</Button>
					<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges && !canSave} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
		</Field.Row>
	</VerticalBar.ScrollableContent>;
}
