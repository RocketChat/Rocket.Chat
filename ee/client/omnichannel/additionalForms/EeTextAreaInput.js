import React from 'react';
import { TextAreaInput, Field } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

export const EeTextAreaInput = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();

	return <Field mbe='x16'>
		<Field.Label>{t(label)}</Field.Label>
		<Field.Row>
			<TextAreaInput flexGrow={1} value={value} onChange={handler} placeholder={t(placeholder)} />
		</Field.Row>
	</Field>;
};

export default EeTextAreaInput;
