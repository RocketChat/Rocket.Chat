import { NumberInput, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

export const EeNumberInput = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t(label)}</Field.Label>
			<Field.Row>
				<NumberInput value={value} onChange={handler} flexGrow={1} placeholder={t(placeholder)} />
			</Field.Row>
		</Field>
	);
};

export default EeNumberInput;
