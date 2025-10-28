import { TextAreaInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const EeTextAreaInput = ({ label, ...props }: { label: string } & ComponentProps<typeof TextAreaInput>) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

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
