import { Box, Field, RadioButton } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { userFormProps } from './AdminUserForm';

type AdminUserSetRandomPasswordProps = {
	control: Control<userFormProps, any>;
	isSmtpEnabled: boolean;
	setRandomPassword: boolean;
	setValue: UseFormSetValue<userFormProps>;
	setRandomPasswordId: string;
};

const AdminUserSetRandomPassword = ({
	control,
	isSmtpEnabled,
	setRandomPassword,
	setValue,
	setRandomPasswordId,
}: AdminUserSetRandomPasswordProps) => {
	const t = useTranslation();

	const setPasswordManuallyId = useUniqueId();

	return (
		<>
			<Box display='flex' flexDirection='row' alignItems='center' flexGrow={1} mbe={8}>
				<Field.Row mie={8}>
					<Controller
						control={control}
						name='setRandomPassword'
						render={({ field: { ref, onChange, value } }) => (
							<RadioButton
								ref={ref}
								id={setRandomPasswordId}
								aria-describedby={`${setRandomPasswordId}-hint`}
								checked={value}
								onChange={() => {
									setValue('setPasswordManually', false);
									onChange(true);
								}}
								disabled={!isSmtpEnabled}
							/>
						)}
					/>
				</Field.Row>
				<Field.Label htmlFor={setRandomPasswordId} alignSelf='center' fontScale='p2'>
					{t('Set_randomly_and_send_by_email')}
				</Field.Label>
			</Box>
			<Box display='flex' flexDirection='row' alignItems='center' flexGrow={1} mbe={12}>
				<Field.Row mie={8}>
					<Controller
						control={control}
						name='setPasswordManually'
						render={({ field: { ref, onChange, value } }) => (
							<RadioButton
								ref={ref}
								id={setPasswordManuallyId}
								aria-describedby={`${setPasswordManuallyId}-hint`}
								checked={value || !setRandomPassword}
								onChange={() => {
									setValue('setRandomPassword', false);
									onChange(true);
								}}
								disabled={!isSmtpEnabled}
							/>
						)}
					/>
				</Field.Row>
				<Field.Label htmlFor={setPasswordManuallyId} alignSelf='center' fontScale='p2'>
					{t('Set_manually')}
				</Field.Label>
			</Box>
		</>
	);
};

export default AdminUserSetRandomPassword;
