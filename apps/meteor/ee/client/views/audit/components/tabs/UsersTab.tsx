import { Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { UserAutoCompleteMultiple } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';

import type { AuditFields } from '../../hooks/useAuditForm';

type UsersTabProps = {
	form: UseFormReturn<AuditFields>;
};

const UsersTab = ({ form: { control } }: UsersTabProps): ReactElement => {
	const t = useTranslation();

	const { field: usersField, fieldState: usersFieldState } = useController({
		name: 'users',
		control,
		rules: {
			required: true,
			validate: (value) => {
				if (value.length < 1) {
					return t('The_field_is_required', t('Users'));
				}
			},
		},
	});

	return (
		<Field flexShrink={1}>
			<FieldLabel>{t('Users')}</FieldLabel>
			<FieldRow>
				<UserAutoCompleteMultiple
					error={!!usersFieldState.error}
					value={usersField.value}
					onChange={usersField.onChange}
					placeholder={t('Username_Placeholder')}
				/>
			</FieldRow>
			{usersFieldState.error?.type === 'required' && <FieldError>{t('The_field_is_required', t('Users'))}</FieldError>}
			{usersFieldState.error?.type === 'validate' && <FieldError>{usersFieldState.error.message}</FieldError>}
		</Field>
	);
};

export default UsersTab;
