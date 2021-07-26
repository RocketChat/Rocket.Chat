import { Field } from '@rocket.chat/fuselage';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../client/components/UserAutoCompleteMultiple';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

const DirectTab = ({ errors, users, onChangeUsers }) => {
	const t = useTranslation();
	const userError = errors ? errors.user : undefined;

	return (
		<Field>
			<Field.Label>{t('Users')}</Field.Label>
			<Field.Row>
				<UserAutoCompleteMultiple
					error={userError}
					value={users}
					onChange={onChangeUsers}
					placeholder={t('Username_Placeholder')}
				/>
			</Field.Row>
			{userError && <Field.Error>{userError}</Field.Error>}
		</Field>
	);
};

export default DirectTab;
