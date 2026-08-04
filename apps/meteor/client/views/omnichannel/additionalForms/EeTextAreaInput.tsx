import type { TextAreaInputProps } from '@rocket.chat/fuselage';
import { TextAreaInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

export type EeTextAreaInputProps = { label: string } & TextAreaInputProps;

export const EeTextAreaInput = ({ label, ...props }: EeTextAreaInputProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<TextAreaInput {...props} />
			</FieldRow>
		</Field>
	);
};

export default EeTextAreaInput;
