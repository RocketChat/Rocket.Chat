import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

type SlaPoliciesSelectProps = {
	value: string;
	label: string;
	options: Serialized<IOmnichannelServiceLevelAgreements[]>;
	onChange: (value: string) => void;
};

export const SlaPoliciesSelect = ({ value, label, options, onChange }: SlaPoliciesSelectProps) => {
	const optionsSelect = useMemo<SelectOption[]>(() => options?.map((option) => [option._id, option.name]), [options]);

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
