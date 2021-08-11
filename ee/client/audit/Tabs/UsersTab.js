import { Field } from '@rocket.chat/fuselage';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../client/components/UserAutoCompleteMultiple';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

const UsersTab = ({ errors, users, onChangeUsers }) => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Users')}</Field.Label>
			<Field.Row>
				<UserAutoCompleteMultiple
					error={errors.users}
					value={users}
					onChange={onChangeUsers}
					placeholder={t('Username_Placeholder')}
				/>
			</Field.Row>
			{errors.users && <Field.Error>{errors.users}</Field.Error>}
		</Field>
	);
};

export default UsersTab;
