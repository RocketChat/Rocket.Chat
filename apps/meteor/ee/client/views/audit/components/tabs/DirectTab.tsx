import { Field } from '@rocket.chat/fuselage';
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
			<Field.Label>{t('Users')}</Field.Label>
			<Field.Row>
				<UserAutoCompleteMultiple
					value={usersField.value}
					error={!!usersFieldState.error}
					onChange={usersField.onChange}
					placeholder={t('Username_Placeholder')}
				/>
			</Field.Row>
			{usersFieldState.error?.type === 'required' && <Field.Error>{t('The_field_is_required', t('Users'))}</Field.Error>}
			{usersFieldState.error?.type === 'validate' && <Field.Error>{usersFieldState.error.message}</Field.Error>}
		</Field>
	);
};

export default DirectTab;
