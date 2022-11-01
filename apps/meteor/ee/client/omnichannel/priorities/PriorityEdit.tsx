import { Field, TextInput, Button, Margins, Box, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useController, useForm } from 'react-hook-form';

import VerticalBar from '../../../../client/components/VerticalBar';

type PriorityEditProps = {
	isNew: boolean;
	priorityId: string;
	reload: () => void;
	data?: {
		name: string;
		description?: string;
		dueTimeInMinutes: string;
	};
};

function PriorityEdit({ data, isNew, priorityId, reload, ...props }: PriorityEditProps): ReactElement {
	const prioritiesRoute = useRoute('omnichannel-priorities');
	const savePriority = useMethod('livechat:savePriority');
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const { name, description, dueTimeInMinutes } = data || {};

	const {
		control,
		getValues,
		formState: { errors, isValid, isDirty },
	} = useForm({
		mode: 'onChange',
		defaultValues: { name, description, dueTimeInMinutes },
	});

	const { field: nameField } = useController({
		control,
		name: 'name',
		rules: { required: t('The_field_is_required', t('Name')) },
	});

	const { field: dueTimeField } = useController({
		control,
		name: 'dueTimeInMinutes',
		rules: {
			validate(value) {
				return !value || Number(value) <= 0 ? t('The_field_is_required', t('Estimated_wait_time_in_minutes')) : true;
			},
		},
	});

	const { field: descField } = useController({ control, name: 'description' });

	const handleReset = useMutableCallback(() => {
		reload();
	});

	const handleSave = useMutableCallback(async () => {
		const { name, description, dueTimeInMinutes } = getValues();

		if (!isValid) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		try {
			await savePriority(priorityId, {
				name,
				description,
				dueTimeInMinutes,
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			prioritiesRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return (
		<VerticalBar.ScrollableContent is='form' {...props}>
			<Field>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Name')} flexGrow={1} {...nameField} error={errors.name?.message} />
				</Field.Row>
				<Field.Error>{errors.name?.message}</Field.Error>
			</Field>
			<Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Description')} flexGrow={1} {...descField} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Estimated_wait_time_in_minutes')}*</Field.Label>
				<Field.Row>
					<NumberInput
						placeholder={t('Estimated_wait_time_in_minutes')}
						flexGrow={1}
						{...dueTimeField}
						error={errors.dueTimeInMinutes?.message}
					/>
				</Field.Row>
				<Field.Error>{errors.dueTimeInMinutes?.message}</Field.Error>
			</Field>

			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						{!isNew && (
							<Button flexGrow={1} type='reset' disabled={!isDirty} onClick={handleReset}>
								{t('Reset')}
							</Button>
						)}
						<Button primary mie='none' flexGrow={1} disabled={!isDirty || !isValid} onClick={handleSave}>
							{t('Save')}
						</Button>
					</Margins>
				</Box>
			</Field.Row>
		</VerticalBar.ScrollableContent>
	);
}

export default PriorityEdit;
