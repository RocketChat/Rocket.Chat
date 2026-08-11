import type { TextInputProps } from '@rocket.chat/fuselage';
import { TextInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

export type EeTextInputProps = { label: string } & TextInputProps;

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
