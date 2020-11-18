import React from 'react';
import { NumberInput, Field } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

export const EeNumberInput = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();

	return <Field>
		<Field.Label>{t(label)}</Field.Label>
		<Field.Row>
			<NumberInput value={value} onChange={handler} flexGrow={1} placeholder={t(placeholder)}/>
		</Field.Row>
	</Field>;
};

export default EeNumberInput;
