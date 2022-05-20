import { Box, EmailInput, Field, TextAreaInput, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { get, useFormContext } from 'react-hook-form';

import AutoCompleteDepartment from '/client/components/AutoCompleteDepartment';

type InboxInforFormProps = {
	department: [];
};
const InboxInfoForm = () => {
	const {
		register,
		formState: { errors, isSubmitting },
	} = useFormContext();

	const t = useTranslation();

	return (
		<Box maxWidth='x600' w='full'>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Active')}</Field.Label>
				</Field>
				<ToggleSwitch {...register('active', { required: false })} />
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Name')}*</Field.Label>
					<TextInput {...register('name', { required: true })} disabled={isSubmitting} data-testid='name' />
					<Field.Error>{get(errors, 'name').message}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Email')}*</Field.Label>
					<EmailInput {...register('email', { required: true })} disabled={isSubmitting} data-testid='email' />
					<Field.Error>{t('Validate_email_address')}</Field.Error>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<TextAreaInput {...register('description', { required: false })} disabled={isSubmitting} rows={4} data-testid='description' />
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Sender_Info')}</Field.Label>
					<TextInput
						{...register('senderInfo', { required: false })}
						placeholder={t('Optional')}
						disabled={isSubmitting}
						data-testid='senderInfo'
					/>
					<Field.Hint>{t('Will_Appear_In_From')}</Field.Hint>
				</Field>
			</Box>
			<Box mbs='x16' mi='x4'>
				<Field>
					<Field.Label>{t('Department')}</Field.Label>
					<AutoCompleteDepartment {...register('department', { required: false })} value={[]} />
					<Field.Hint>{t('Only_Members_Selected_Department_Can_View_Channel')}</Field.Hint>
				</Field>
			</Box>
		</Box>
	);
};

export default InboxInfoForm;
