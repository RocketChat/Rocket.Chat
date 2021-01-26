import React from 'react';
import { Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { UserAutoComplete } from '../../components/AutoComplete';

export const ContactManager = ({ value, handler }) => {
	const t = useTranslation();

	return <Field>
		<Field.Label>{t('Contact_Manager')}</Field.Label>
		<Field.Row>
			<UserAutoComplete value={value} onChange={handler}/>
		</Field.Row>
	</Field>;
};

export default ContactManager;
