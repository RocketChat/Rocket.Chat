import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import AutoCompleteAgent from '../../../../client/components/AutoCompleteAgent';

export const ContactManager = ({ value: userId, handler }) => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Contact_Manager')}</Field.Label>
			<Field.Row>
				<AutoCompleteAgent haveNoAgentsSelectedOption value={userId} onChange={handler} />
			</Field.Row>
		</Field>
	);
};

export default ContactManager;
