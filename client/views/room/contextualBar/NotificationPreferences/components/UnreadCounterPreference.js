import { Icon, Field, FieldGroup, Select } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const UnreadCounterPreference = ({
	label,
	description,
	icon,
	options,
	optionDefault,
	onChange,
}) => (
	<FieldGroup>
		<Field.Row>
			<Icon name={icon} size='x18' />
			<Field.Label>{label}</Field.Label>
		</Field.Row>
		<Field.Row mb='x0'>
			<Field.Description pi='x26'>{description}:</Field.Description>
			<Select options={options} value={optionDefault} onChange={onChange} />
		</Field.Row>
	</FieldGroup>
);

export default memo(UnreadCounterPreference);
