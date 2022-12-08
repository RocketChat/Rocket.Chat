import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { Field, Button, Box, ButtonGroup, Throbber } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import StringSettingInput from '../../../../client/views/admin/settings/inputs/StringSettingInput';

export type PriorityFormData = { name: string };

export type ILivechatClientPriority = Serialized<ILivechatPriority> & {
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

	const { name, i18n, dirty, _id } = data;

	const {
		control,
		getValues,
		setValue,
		formState: { errors, isValid, isDirty },
		setError,
		handleSubmit,
	} = useForm<PriorityFormData>({
		mode: 'onChange',
		defaultValues: data ? { name: dirty ? name : t(i18n) } : {},
	});

	const handleSave = useMutableCallback(async () => {
		const values = getValues();

		if (!isValid) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
		}

		try {
			setSaving(true);
			await onSave(values);
		} catch (e) {
			const { error } = e as PrioritySaveException;

			if (error) {
				setError('name', { message: t(error) });
			}
		} finally {
			setSaving(false);
		}
	});

	const resetName = (): void => {
		setValue('name', t(i18n), {
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
					rules={{ required: t('The_field_is_required', t('Name')), validate: (v) => v.trim() !== '' }}
					render={({ field: { value, onChange } }): ReactElement => (
						<StringSettingInput
							_id={_id}
							disabled={isSaving}
							error={errors.name?.message}
							label={`${t('Name')}*`}
							placeholder={t('Name')}
							value={value}
							hasResetButton={value !== t(i18n)}
							onChangeValue={onChange}
							onResetButtonClick={resetName}
						/>
					)}
				/>
				<Field.Error>{errors.name?.message}</Field.Error>
			</Field>

			<ButtonGroup stretch>
				<Button onClick={(): void => onCancel()} disabled={isSaving}>
					{t('Cancel')}
				</Button>

				<Button primary disabled={!isDirty || !isValid || isSaving} onClick={handleSave}>
					{isSaving ? <Throbber size='x12' inheritColor /> : t('Save')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default PriorityEditForm;
