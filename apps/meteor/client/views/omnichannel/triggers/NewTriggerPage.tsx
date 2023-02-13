import { Button, FieldGroup, Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { TriggerConditions, TriggerActions } from './TriggersForm';
import TriggersForm from './TriggersForm';

export type TriggersFormType = {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	// In the future, this will be an array
	conditions: TriggerConditions;
	// In the future, this will be an array
	actions: TriggerActions;
};

const defaultNewFormValues = {
	name: '',
	description: '',
	enabled: false,
	runOnce: false,
	conditions: {
		name: 'page-url',
		value: '',
	},
	actions: {
		name: '',
		params: {
			sender: 'queue',
			msg: '',
			name: '',
		},
	},
};

const NewTriggerPage = ({ onSave }: { onSave: () => void }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const methods = useForm<TriggersFormType>({ defaultValues: defaultNewFormValues });
	const {
		getValues,
		handleSubmit,
		formState: { isDirty },
		watch,
	} = methods;

	const watchName = watch('name');
	const watchMsg = watch('actions.params.msg');

	const router = useRoute('omnichannel-triggers');

	const save = useMethod('livechat:saveTrigger');

	const values = getValues();

	const handleSave = useMutableCallback(async () => {
		try {
			const {
				actions: {
					params: { sender, msg, name },
				},
				...restValues
			} = values;
			await save({
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

	const canSave = useMemo(() => watchName && watchMsg && isDirty, [watchName, watchMsg, isDirty]);

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

export default NewTriggerPage;
