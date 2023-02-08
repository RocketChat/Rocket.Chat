import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UserAutoCompleteMultiple from '../../../../../../client/components/UserAutoCompleteMultiple';

type DirectTabProps = {
	errors: Record<string, string>;
	users: string[];
	onChangeUsers: (users: string[]) => void;
};

const DirectTab = ({ errors, users, onChangeUsers }: DirectTabProps): ReactElement => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Users')}</Field.Label>
			<Field.Row>
				<UserAutoCompleteMultiple error={!!errors.users} value={users} onChange={onChangeUsers} placeholder={t('Username_Placeholder')} />
			</Field.Row>
			{errors.users && <Field.Error>{errors.users}</Field.Error>}
		</Field>
	);
};

export default DirectTab;
