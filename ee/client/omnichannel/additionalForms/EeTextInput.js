import React from 'react';
import { TextInput, Field } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

export const EeTextInput = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();

	return <Field>
		<Field.Label>{t(label)}</Field.Label>
		<Field.Row>
			<TextInput flexGrow={1} value={value} onChange={handler} placeholder={t(placeholder)} />
		</Field.Row>
	</Field>;
};

export default EeTextInput;
