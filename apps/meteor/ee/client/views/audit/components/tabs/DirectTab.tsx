import { Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';

import UserAutoCompleteMultiple from '../../../../../../client/components/UserAutoCompleteMultiple';
import type { AuditFields } from '../../hooks/useAuditForm';

type DirectTabProps = {
	form: UseFormReturn<AuditFields>;
};

const DirectTab = ({ form: { control } }: DirectTabProps): ReactElement => {
	const t = useTranslation();

	const { field: usersField, fieldState: usersFieldState } = useController({
		name: 'users',
		control,
		rules: {
			required: true,
			validate: (value) => {
				if (value.length < 2) {
					return t('Select_at_least_two_users');
				}
			},
		},
	});

	return (
		<Field flexShrink={1}>
			<FieldLabel>{t('Users')}</FieldLabel>
			<FieldRow>
				<UserAutoCompleteMultiple
					value={usersField.value}
					error={!!usersFieldState.error}
					onChange={usersField.onChange}
					placeholder={t('Username_Placeholder')}
				/>
			</FieldRow>
			{usersFieldState.error?.type === 'required' && <FieldError>{t('The_field_is_required', t('Users'))}</FieldError>}
			{usersFieldState.error?.type === 'validate' && <FieldError>{usersFieldState.error.message}</FieldError>}
		</Field>
	);
};

export default DirectTab;
