import { Box, FieldHint, FieldLabel, FieldRow, RadioButton } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import { useId } from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
		<>
			<Box display='flex' flexDirection='row' alignItems='center' flexGrow={1} mbe={8}>
				<FieldRow mie={8}>
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
				<FieldLabel htmlFor={setRandomPasswordId} alignSelf='center' fontScale='p2' disabled={!isSmtpEnabled}>
					{t('Set_randomly_and_send_by_email')}
				</FieldLabel>
			</Box>
			{!isSmtpEnabled && (
				<FieldHint
					id={`${setRandomPasswordId}-hint`}
					dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' })) }}
					mbe={16}
					mbs={0}
				/>
			)}
			<Box display='flex' flexDirection='row' alignItems='center' flexGrow={1}>
				<FieldRow mie={8}>
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
				<FieldLabel htmlFor={setPasswordManuallyId} alignSelf='center' fontScale='p2'>
					{t('Set_manually')}
				</FieldLabel>
			</Box>
		</>
	);
};

export default AdminUserSetRandomPasswordRadios;
