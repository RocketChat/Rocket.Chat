import { Field, Select } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

export const PrioritiesSelect = ({ options, value, handler, label }) => {
	const optionsSelect = useMemo(() => options && options.length > 0 && options.map((option) => [option._id, option.name]), [options]);

	return (
		<Field>
			<Field.Label>{label}</Field.Label>
			<Field.Row>
				<Select value={value} onChange={handler} options={optionsSelect} />
			</Field.Row>
		</Field>
	);
};

export default PrioritiesSelect;
