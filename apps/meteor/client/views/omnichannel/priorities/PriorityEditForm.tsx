import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow, TextInput, Button, ButtonGroup, ContextualbarFooter } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFormSubmitWithDirtyCheck } from '../../../hooks/useFormSubmitWithDirtyCheck';

export type PriorityFormData = { name: string; reset: boolean };

export type PriorityEditFormProps = {
	data: Serialized<ILivechatPriority>;
	onCancel: () => void;
	onSave: (values: PriorityFormData) => Promise<void>;
};

type PrioritySaveException = { success: false; error: TranslationKey | undefined };

const PriorityEditForm = ({ data, onSave, onCancel }: PriorityEditFormProps): ReactElement => {
	const { t } = useTranslation();

	const { name, i18n, dirty } = data;
	const defaultName = t(i18n);

	const {
		control,
		formState: { errors, isDirty, isSubmitting },
		setError,
		handleSubmit,
	} = useForm<PriorityFormData>({
		defaultValues: data ? { name: dirty ? name : defaultName } : {},
	});

	const nameFieldId = useId();

	const handleSave = useFormSubmitWithDirtyCheck(
		async ({ name }: { name: string }) => {
			try {
				await onSave({ name, reset: name === defaultName });
			} catch (e) {
				const { error } = e as PrioritySaveException;

				if (error) {
					setError('name', { message: t(error) });
				}
			}
		},
		{ isDirty },
	);

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={nameFieldId} required>
							{t('Name')}
						</FieldLabel>
					</FieldRow>
					<FieldRow>
						<Controller
							name='name'
							control={control}
							rules={{
								required: t('Required_field', { field: t('Name') }),
								validate: (value: string) => value?.trim() !== '' || t('Required_field', { field: t('Name') }),
							}}
							render={({ field: { value, onChange } }): ReactElement => (
								<TextInput
									id={nameFieldId}
									value={value}
									placeholder={t('Name')}
									disabled={isSubmitting}
									onChange={(e) => onChange((e.target as HTMLInputElement).value)}
									aria-describedby={`${nameFieldId}-error`}
									aria-invalid={Boolean(errors.name?.message)}
									error={errors.name?.message}
								/>
							)}
						/>
					</FieldRow>
					{errors.name && (
						<FieldError role='alert' id={`${nameFieldId}-error`}>
							{errors.name.message}
						</FieldError>
					)}
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => onCancel()} disabled={isSubmitting}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' loading={isSubmitting}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default PriorityEditForm;
