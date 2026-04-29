import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type SlaPoliciesSelectProps = {
	value: string;
	label: string;
	options: Serialized<IOmnichannelServiceLevelAgreements[]>;
	onChange: (value: string) => void;
};

export const SlaPoliciesSelect = ({ value, label, options, onChange }: SlaPoliciesSelectProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');
	const optionsSelect = useMemo<SelectOption[]>(() => options?.map((option) => [option._id, option.name]), [options]);
	const fieldId = useId();

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel id={fieldId}>{label}</FieldLabel>
			<FieldRow>
				<Select aria-labelledby={fieldId} value={value} options={optionsSelect} onChange={(value) => onChange(String(value))} />
			</FieldRow>
		</Field>
	);
};

export default SlaPoliciesSelect;
