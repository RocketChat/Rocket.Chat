import { NumberInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

export type EeNumberInputProps = { label: string } & ComponentProps<typeof NumberInput>;

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
