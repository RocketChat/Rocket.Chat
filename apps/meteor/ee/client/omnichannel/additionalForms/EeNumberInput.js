import { NumberInput, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const EeNumberInput = ({ value, handler, label, placeholder }) => {
	const t = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

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
