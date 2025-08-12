import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import moment from 'moment-timezone';
import type { ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type SelectTimezoneSettingInputProps = SettingInputProps;

function SelectTimezoneSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: SelectTimezoneSettingInputProps): ReactElement {
	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
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
		</Field>
	);
}

export default SelectTimezoneSettingInput;
