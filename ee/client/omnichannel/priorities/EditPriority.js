import React, { useMemo } from 'react';
import { Field, TextInput, Button, Margins, Box, NumberInput, Callout } from '@rocket.chat/fuselage';
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

	if (error || !data) {
		return <Callout m='x16' type='danger'>{t('Not_Available')}</Callout>;
	}

	return <PriorityEdit priorityId={priorityId} data={data} reload={reload}/>;
}

export function PriorityNew({ reload }) {
	return <PriorityEdit isNew reload={reload}/>;
}

export function PriorityEdit({ data, isNew, priorityId, reload, ...props }) {
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

	const nameError = useMemo(() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined), [name, t]);
	const dueTimeInMinutesError = useMemo(() => (!dueTimeInMinutes || dueTimeInMinutes <= 0 ? t('The_field_is_required', 'Estimated_due_time_in_minutes') : undefined), [dueTimeInMinutes, t]);

	const savePriority = useMethod('livechat:savePriority');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const canSave = useMemo(() => !nameError && !dueTimeInMinutesError, [nameError, dueTimeInMinutesError]);

	const handleSave = useMutableCallback(async () => {
		const payload = { name, description, dueTimeInMinutes: `${ dueTimeInMinutes }` };

		if (!canSave) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
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
				<TextInput flexGrow={1} value={description} onChange={handleDescription} />
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
					{ !isNew && <Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={handleReset}>{t('Reset')}</Button> }
					<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges && !canSave} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
		</Field.Row>
	</VerticalBar.ScrollableContent>;
}
