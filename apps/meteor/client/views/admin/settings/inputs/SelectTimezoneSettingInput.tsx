import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
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
