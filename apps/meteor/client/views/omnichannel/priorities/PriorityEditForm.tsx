import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, Button, Box, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import StringSettingInput from '../../admin/settings/Setting/inputs/StringSettingInput';

export type PriorityFormData = { name: string; reset: boolean };

export type PriorityEditFormProps = {
	data: Serialized<ILivechatPriority>;
	onCancel: () => void;
	onSave: (values: PriorityFormData) => Promise<void>;
};

type PrioritySaveException = { success: false; error: TranslationKey | undefined };

const PriorityEditForm = ({ data, onSave, onCancel }: PriorityEditFormProps): ReactElement => {
	const { t } = useTranslation();
	const [isSaving, setSaving] = useState(false);

	const { name, i18n, dirty } = data;
	const defaultName = t(i18n);

	const defaultNameValue = data && dirty ? name : defaultName;

	const {
		control,
		setValue,
		formState: { errors, isDirty },
		setError,
		handleSubmit,
	} = useForm<PriorityFormData>({
		mode: 'onSubmit',
		reValidateMode: 'onChange',
		defaultValues: { name: defaultNameValue || '' },
	});

	const nameFieldId = useId();

	const handleSave = async ({ name }: { name: string }) => {
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
	};

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
					rules={{
						required: t('Required_field', { field: t('Name') }),
					}}
					render={({ field: { value, onChange } }): ReactElement => (
						<StringSettingInput
							_id={nameFieldId}
							packageValue={defaultName}
							disabled={isSaving}
							error={errors.name?.message}
							label={`${t('Name')}*`}
							placeholder={t('Name')}
							value={value}
							name='name'
							hasResetButton={value !== t(i18n)}
							onResetButtonClick={onReset}
							onChangeValue={onChange}
							aria-describedby={`${nameFieldId}-error`}
							aria-invalid={Boolean(errors.name?.message)}
						/>
					)}
				/>
				{errors.name && (
					<FieldError role='alert' id={`${nameFieldId}-error`}>
						{errors.name.message}
					</FieldError>
				)}
			</Field>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => onCancel()} disabled={isSaving}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' disabled={!isDirty} loading={isSaving}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Box>
	);
};

export default PriorityEditForm;
