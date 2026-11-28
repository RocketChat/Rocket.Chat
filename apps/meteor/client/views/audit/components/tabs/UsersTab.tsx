import { Box, Field, FieldLabel, FieldRow, FieldError, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import type { AuditFields } from '../../hooks/useAuditForm';

export type UsersTabProps = {
	form: UseFormReturn<AuditFields>;
	actions?: ReactNode;
};

const UsersTab = ({ form: { control }, actions }: UsersTabProps) => {
	const { t } = useTranslation();

	const { field: usersField, fieldState: usersFieldState } = useController({
		name: 'users',
		control,
		rules: {
			required: true,
			validate: (value) => {
				if (value.length < 1) {
					return t('Required_field', { field: t('Users') });
				}
			},
		},
	});

	return (
		<Box width='full'>
			<Field>
				<FieldLabel>{t('Users')}</FieldLabel>
				<FieldRow>
					<Stack direction='row' align='center' grow gap='x8'>
						<UserAutoCompleteMultiple
							error={usersFieldState.error?.message}
							value={usersField.value}
							onChange={usersField.onChange}
							placeholder={t('Username_Placeholder')}
						/>
						{actions}
					</Stack>
				</FieldRow>
				{usersFieldState.error?.type === 'required' && <FieldError>{t('Required_field', { field: t('Users') })}</FieldError>}
				{usersFieldState.error?.type === 'validate' && <FieldError>{usersFieldState.error.message}</FieldError>}
			</Field>
		</Box>
	);
};

export default UsersTab;
