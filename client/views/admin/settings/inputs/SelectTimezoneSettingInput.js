import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
import moment from 'moment-timezone';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

function SelectTimezoneSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const handleChange = (value) => {
		onChangeValue && onChangeValue(value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<Field.Row>
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					options={moment.tz.names().map((key) => [key, key])}
				/>
			</Field.Row>
		</>
	);
}

export default SelectTimezoneSettingInput;
