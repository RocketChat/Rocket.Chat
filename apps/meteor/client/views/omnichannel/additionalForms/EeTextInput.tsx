import { TextInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

export type EeTextInputProps = { label: string } & ComponentProps<typeof TextInput>;

export const EeTextInput = ({ label, ...props }: EeTextInputProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<TextInput {...props} />
			</FieldRow>
		</Field>
	);
};

export default EeTextInput;
