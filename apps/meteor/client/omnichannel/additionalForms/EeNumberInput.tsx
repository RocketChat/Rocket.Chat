import { NumberInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const EeNumberInput = ({ label, ...props }: { label: string } & ComponentProps<typeof NumberInput>) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<NumberInput {...props} flexGrow={1} />
			</FieldRow>
		</Field>
	);
};

export default EeNumberInput;
