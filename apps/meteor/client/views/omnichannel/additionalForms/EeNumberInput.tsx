import type { NumberInputProps } from '@rocket.chat/fuselage';
import { NumberInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

export type EeNumberInputProps = { label: string } & NumberInputProps;

export const EeNumberInput = ({ label, ...props }: EeNumberInputProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

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
