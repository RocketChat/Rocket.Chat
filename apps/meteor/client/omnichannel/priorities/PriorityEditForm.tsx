import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, Button, Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import StringSettingInput from '../../views/admin/settings/inputs/StringSettingInput';

export type PriorityFormData = { name: string; reset: boolean };

type ILivechatClientPriority = Serialized<ILivechatPriority> & {
	i18n: TranslationKey;
};

export type PriorityEditFormProps = {
	data: ILivechatClientPriority;
	onCancel: () => void;
	onSave: (values: PriorityFormData) => Promise<void>;
};

type PrioritySaveException = { success: false; error: TranslationKey | undefined };

const PriorityEditForm = ({ data, onSave, onCancel }: PriorityEditFormProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const [isSaving, setSaving] = useState(false);

	const { name, i18n, dirty } = data;
	const defaultName = t(i18n);

	const {
		control,
		getValues,
		setValue,
		formState: { errors, isValid, isDirty },
		setError,
		handleSubmit,
	} = useForm<PriorityFormData>({
		mode: 'onChange',
		defaultValues: data ? { name: dirty ? name : defaultName } : {},
	});

	const handleSave = useMutableCallback(async () => {
		const { name } = getValues();

		if (!isValid) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		try {
			setSaving(true);
			await onSave({ name, reset: name === defaultName });
		} catch (e) {
			const { error } = e as PrioritySaveException;

			if (error) {
				setError('name', { message: t(error) });
			}
		} finally {
			setSaving(false);
		}
	});

	const onReset = (): void => {
		setValue('name', defaultName, {
			shouldDirty: true,
			shouldValidate: true,
		});
	};

	return (
		<Box is='form' onSubmit={handleSubmit(handleSave)} display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
			<Field>
				<Controller
					name='name'
					control={control}
					rules={{ required: t('The_field_is_required', t('Name')), validate: (v) => v?.trim() !== '' }}
					render={({ field: { value, onChange } }): ReactElement => (
						<StringSettingInput
							_id=''
							disabled={isSaving}
							error={errors.name?.message}
							label={`${t('Name')}*`}
							placeholder={t('Name')}
							value={value}
							name='name'
							hasResetButton={value !== t(i18n)}
							onResetButtonClick={onReset}
							onChangeValue={onChange}
						/>
					)}
				/>
				<FieldError>{errors.name?.message}</FieldError>
			</Field>

			<ButtonGroup stretch>
				<Button onClick={(): void => onCancel()} disabled={isSaving}>
					{t('Cancel')}
				</Button>

				<Button primary disabled={!isDirty || !isValid} loading={isSaving} onClick={handleSave}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default PriorityEditForm;
