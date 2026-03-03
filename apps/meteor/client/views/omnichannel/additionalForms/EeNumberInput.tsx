import { NumberInput, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ChangeEvent, ComponentProps } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

export const EeNumberInput = ({ label, ...props }: { label: string } & ComponentProps<typeof NumberInput>) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');
	const { onChange, min, ...rest } = props;

	if (!hasLicense) {
		return null;
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (Number(event.currentTarget.value) < 0) {
			event.currentTarget.value = '0';
		}

		onChange?.(event);
	};

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<NumberInput {...rest} min={min ?? 0} onChange={handleChange} flexGrow={1} />
			</FieldRow>
		</Field>
	);
};

export default EeNumberInput;
