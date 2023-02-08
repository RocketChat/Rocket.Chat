import { Margins, FieldGroup, Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import TriggersForm from './TriggersForm';

const getInitialValues = ({
	name,
	description,
	enabled,
	runOnce,
	conditions: [{ name: condName, value: condValue }],
	actions: [
		{
			action: actName,
			params: { sender: actSender, msg: actMsg, name: actSenderName },
		},
	],
}) => ({
	name: name ?? '',
	description: description ?? '',
	enabled: !!enabled,
	runOnce: !!runOnce,
	conditions: {
		name: condName ?? 'page-url',
		value: condValue ?? '',
	},
	actions: {
		name: actName ?? '',
		params: {
			sender: actSender ?? 'queue',
			msg: actMsg ?? '',
			name: actSenderName ?? '',
		},
	},
});

const EditTriggerPage = ({ data, onSave }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

	const methods = useForm({ defaultValues: getInitialValues(data), mode: 'onChange' });
	const { reset, setValue, getValues, handleSubmit, formState } = methods;

	// useEffect(() => {
	// 	methods.setValue('enabled', data.enabled);
	// 	methods.setValue('name', data.name);
	// 	methods.setValue('description', data.description);
	// 	methods.setValue('runOnce', data.runOnce);
	// 	methods.setValue('conditions', { value: data.conditions.value });
	// 	// methods.setValue('actions', {
	// 	// 	name: data.actions.name,
	// 	// 	params: { msg: data.actions.params.msg, actionAgentName: data.actions.params.name },
	// 	// });
	// }, [data, methods]);

	const handleDebug = useCallback(() => {
		reset(getInitialValues(data));
	}, [reset, data]);

	// useEffect(() => {
	// 	const dataValues = getInitialValues(data);
	// 	reset(dataValues);
	// }, [data, reset]);

	const values = getValues();
	const hasUnsavedChanges = formState.isDirty;
	const handleSave = useMutableCallback(async () => {
		try {
			const {
				actions: {
					params: { sender, msg, name },
				},
				...restValues
			} = values;
			await save({
				_id: data._id,
				...restValues,
				conditions: [values.conditions],
				actions: [
					{
						name: 'send-message',
						params: {
							sender,
							msg,
							...(sender === 'custom' && { name }),
						},
					},
				],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onSave();
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const { name } = values;

	const canSave = name && hasUnsavedChanges;

	return (
		<>
			<FieldGroup>
				<FormProvider {...methods}>
					<TriggersForm values={values} />
				</FormProvider>
			</FieldGroup>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='submit' primary onClick={handleSubmit(handleSave)} disabled={!canSave}>
						{t('Save')}
					</Button>
					<Button flexGrow={1} type='button' primary onClick={handleDebug}>
						Debug
					</Button>
				</Margins>
			</Box>
		</>
	);
};

export default EditTriggerPage;
