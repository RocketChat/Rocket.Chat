import { Box, FieldLabel, FieldRow, Flex, Select } from '@rocket.chat/fuselage';
import moment from 'moment-timezone';
import type { ReactElement } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type SelectTimezoneSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

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
}: SelectTimezoneSettingInputProps): ReactElement {
	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<FieldLabel htmlFor={_id} title={_id}>
						{label}
					</FieldLabel>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<FieldRow>
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={(value) => handleChange(String(value))}
					options={moment.tz.names().map((key) => [key, key])}
				/>
			</FieldRow>
		</>
	);
}

export default SelectTimezoneSettingInput;
