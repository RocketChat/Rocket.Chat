import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

type SlaPoliciesSelectProps = {
	value: string;
	label: string;
	options: Serialized<IOmnichannelServiceLevelAgreements[]>;
	onChange: (value: string) => void;
};

export const SlaPoliciesSelect = ({ value, label, options, onChange }: SlaPoliciesSelectProps) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const optionsSelect = useMemo<SelectOption[]>(() => options?.map((option) => [option._id, option.name]), [options]);

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<Select value={value} options={optionsSelect} onChange={(value) => onChange(String(value))} />
			</FieldRow>
		</Field>
	);
};

export default SlaPoliciesSelect;
