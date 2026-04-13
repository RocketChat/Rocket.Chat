import { Field, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import { useTimezoneNameList } from '../../../../../hooks/useTimezoneNameList';
import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type SelectTimezoneSettingInputProps = SettingInputProps;

function SelectTimezoneSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: SelectTimezoneSettingInputProps): ReactElement {
	const timezoneNames = useTimezoneNameList();

	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<Select
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={(value) => handleChange(String(value))}
					options={timezoneNames.map((key) => [key, key])}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default SelectTimezoneSettingInput;
