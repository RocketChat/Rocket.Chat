import { Box, FieldHint, FieldLabel, FieldRow, RadioButton } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import type { UserFormProps } from './AdminUserForm';

type AdminUserSetRandomPasswordProps = {
	isNewUserPage: boolean | undefined;
	control: Control<UserFormProps, any>;
	isSmtpEnabled: boolean | undefined;
	setRandomPasswordId: string;
	setValue: UseFormSetValue<UserFormProps>;
};

const AdminUserSetRandomPasswordRadios = ({
	isNewUserPage,
	control,
	isSmtpEnabled,
	setRandomPasswordId,
	setValue,
}: AdminUserSetRandomPasswordProps) => {
	const { t } = useTranslation();

	const setPasswordManuallyId = useId();

	const handleSetRandomPasswordChange = (onChange: (...event: any[]) => void, value: boolean) => {
		setValue('requirePasswordChange', value);

		onChange(value);
	};

	return (
		<Box display='flex' flexDirection='column' gap={6} paddingBlockStart={6}>
			<Box display='flex' alignItems='center' gap={8}>
				<FieldRow>
					<Controller
						control={control}
						name='setRandomPassword'
						defaultValue={isSmtpEnabled && isNewUserPage}
						render={({ field: { ref, onChange, value } }) => (
							<RadioButton
								ref={ref}
								id={setRandomPasswordId}
								aria-describedby={`${setRandomPasswordId}-hint`}
								checked={value}
								onChange={() => handleSetRandomPasswordChange(onChange, true)}
								disabled={!isSmtpEnabled}
							/>
						)}
					/>
				</FieldRow>
				<Box>
					<FieldLabel htmlFor={setRandomPasswordId} disabled={!isSmtpEnabled}>
						{t('Set_randomly_and_send_by_email')}
					</FieldLabel>
				</Box>
			</Box>
			{!isSmtpEnabled && (
				<Box display='flex' flexDirection='column' paddingBlockEnd={6}>
					<FieldHint id={`${setRandomPasswordId}-hint`}>
						<Trans
							i18nKey='Send_Email_SMTP_Warning'
							components={{
								// oxlint-disable-next-line jsx-a11y/anchor-has-content
								a: <a href='/admin/settings/Email' />,
							}}
						/>
					</FieldHint>
				</Box>
			)}
			<Box display='flex' alignItems='center' gap={8} paddingBlockStart={2}>
				<FieldRow>
					<Controller
						control={control}
						name='setRandomPassword'
						defaultValue={!isNewUserPage}
						render={({ field: { ref, onChange, value } }) => (
							<RadioButton
								ref={ref}
								id={setPasswordManuallyId}
								aria-describedby={`${setPasswordManuallyId}-hint`}
								checked={!value}
								onChange={() => handleSetRandomPasswordChange(onChange, false)}
							/>
						)}
					/>
				</FieldRow>
				<Box>
					<FieldLabel htmlFor={setPasswordManuallyId}>{t('Set_manually')}</FieldLabel>
				</Box>
			</Box>
		</Box>
	);
};

export default AdminUserSetRandomPasswordRadios;
