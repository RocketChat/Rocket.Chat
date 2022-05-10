import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAutoComplete from '../../../../client/components/UserAutoComplete';

export const ContactManager = ({ value, handler }) => {
	const t = useTranslation();

	const conditions = { roles: 'livechat-agent' };

	return (
		<Field>
			<Field.Label>{t('Contact_Manager')}</Field.Label>
			<Field.Row>
				<UserAutoComplete conditions={conditions} value={value} onChange={handler} />
			</Field.Row>
		</Field>
	);
};

export default ContactManager;
