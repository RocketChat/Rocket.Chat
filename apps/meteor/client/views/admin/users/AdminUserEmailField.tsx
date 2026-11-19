import type { ISetting } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow, Icon, Skeleton, Stack, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { validateEmail } from '@rocket.chat/tools';
import { useId } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import type { UserFormProps } from './AdminUserForm';

type AdminUserEmailFieldProps = {
	control: Control<UserFormProps>;
	errors: FieldErrors<UserFormProps>;
	isLoadingSmtpStatus: boolean;
	isSmtpEnabled: boolean;
	isVerificationNeeded: ISetting['value'] | undefined;
};

const AdminUserEmailField = ({ control, errors, isLoadingSmtpStatus, isSmtpEnabled, isVerificationNeeded }: AdminUserEmailFieldProps) => {
	const { t } = useTranslation();
	const emailId = useId();
	const verifiedId = useId();

	return (
		<Field>
			<FieldLabel htmlFor={emailId}>{t('Email')}</FieldLabel>
			<FieldRow>
				<Controller
					control={control}
					name='email'
					rules={{
						required: t('Required_field', { field: t('Email') }),
						validate: (email) => (validateEmail(email) ? undefined : t('error-invalid-email-address')),
					}}
					render={({ field }) => (
						<TextInput
							{...field}
							id={emailId}
							aria-invalid={errors.email ? 'true' : 'false'}
							aria-describedby={`${emailId}-error`}
							error={errors.email?.message}
						/>
					)}
				/>
			</FieldRow>
			{errors.email && (
				<FieldError aria-live='assertive' id={`${emailId}-error`}>
					{errors.email.message}
				</FieldError>
			)}
			{isLoadingSmtpStatus ? (
				<Skeleton width='full' height={26} />
			) : (
				<>
					<FieldRow>
						<Stack direction='row' align='center' gap={4}>
							<FieldLabel htmlFor={verifiedId} disabled={!isSmtpEnabled || !isVerificationNeeded}>
								{t('Mark_email_as_verified')}
							</FieldLabel>
							<Icon name='info-circled' size='x20' title={t('Enable_to_bypass_email_verification')} />
						</Stack>
						<Controller
							control={control}
							name='verified'
							render={({ field: { onChange, value } }) => (
								<ToggleSwitch id={verifiedId} checked={value} onChange={onChange} disabled={!isSmtpEnabled || !isVerificationNeeded} />
							)}
						/>
					</FieldRow>
					{isVerificationNeeded && !isSmtpEnabled && (
						<FieldHint id={`${verifiedId}-hint`}>
							<Trans
								i18nKey='Send_Email_SMTP_Warning'
								components={{
									// oxlint-disable-next-line jsx-a11y/anchor-has-content
									a: <a href='/admin/settings/Email' />,
								}}
							/>
						</FieldHint>
					)}
					{!isVerificationNeeded && (
						<FieldHint id={`${verifiedId}-hint`}>
							<Trans
								i18nKey='Email_verification_isnt_required'
								components={{
									// oxlint-disable-next-line jsx-a11y/anchor-has-content
									a: <a href='/admin/settings/Accounts' />,
								}}
							/>
						</FieldHint>
					)}
				</>
			)}
		</Field>
	);
};

export default AdminUserEmailField;
