import type { ILivechatTrigger, Serialized } from '@rocket.chat/core-typings';
import { Margins, FieldGroup, Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import type { TriggersFormType } from './NewTriggerPage';
import TriggersForm from './TriggersForm';

const getInitialValues = ({
	name,
	description,
	enabled,
	runOnce,
	conditions: [{ name: condName, value: condValue }],
	actions: [
		{ name: actName, params: { sender: actSender, msg: actMsg, name: actSenderName } = { sender: 'queue' as const, msg: '', name: '' } },
	],
}: Serialized<ILivechatTrigger>): TriggersFormType => ({
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

const EditTriggerPage = ({ data, onSave }: { data: Serialized<ILivechatTrigger>; onSave: () => void }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

	const methods = useForm<TriggersFormType>({ defaultValues: getInitialValues(data), mode: 'onChange' });
	const { getValues, handleSubmit, formState } = methods;

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
				</Margins>
			</Box>
		</>
	);
};

export default EditTriggerPage;
