import { Box, Field, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { UserFormProps } from './AdminUserForm';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type AdminUserStatusFieldProps = ComponentProps<typeof Field> & { control: Control<UserFormProps> };

const userStatusEnabledId = 'admin-user-status-enabled';

const AdminUserStatusField = ({ control, ...props }: AdminUserStatusFieldProps) => {
	const { t } = useTranslation();
	const canEditOtherUserInfo = usePermission('edit-other-user-info');
	const { data: hasPresenceLicense = false } = useHasLicenseModule('unlimited-presence');
	const userStatusSetting = useSetting('Accounts_UserStatus_Enabled', true);

	if (!canEditOtherUserInfo || !hasPresenceLicense || userStatusSetting === false) {
		return null;
	}

	return (
		<Field {...props}>
			<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1} marginBlockEnd={8}>
				<FieldLabel htmlFor={userStatusEnabledId}>{t('User_status')}</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name='userStatusEnabled'
						render={({ field: { ref, onChange, value } }) => (
							<ToggleSwitch
								id={userStatusEnabledId}
								ref={ref}
								aria-describedby={`${userStatusEnabledId}-hint`}
								onChange={onChange}
								checked={value}
							/>
						)}
					/>
				</FieldRow>
			</Box>
			<FieldHint id={`${userStatusEnabledId}-hint`} marginBlockStart={0}>
				{t('User_status_admin_toggle_Description')}
			</FieldHint>
		</Field>
	);
};

export default AdminUserStatusField;
