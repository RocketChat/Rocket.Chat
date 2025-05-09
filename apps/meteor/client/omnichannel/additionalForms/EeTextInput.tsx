import { TextInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const EeTextInput = ({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

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
