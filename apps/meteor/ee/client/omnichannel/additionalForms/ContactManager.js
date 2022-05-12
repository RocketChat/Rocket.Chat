import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UserAutoComplete from '../../../../client/components/UserAutoComplete';

export const ContactManager = ({ value, handler }) => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Contact_Manager')}</Field.Label>
			<Field.Row>
				<UserAutoComplete value={value} onChange={handler} />
			</Field.Row>
		</Field>
	);
};

export default ContactManager;
