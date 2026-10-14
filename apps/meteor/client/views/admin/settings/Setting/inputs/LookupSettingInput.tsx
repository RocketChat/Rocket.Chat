import { Field, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';
import type { SettingLookupEndpoint } from '../../hooks/useSettingLookupOptions';
import { useSettingLookupOptions } from '../../hooks/useSettingLookupOptions';

export type LookupSettingInputProps = SettingInputProps & {
	lookupEndpoint: SettingLookupEndpoint;
};

function LookupSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	lookupEndpoint,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: LookupSettingInputProps) {
	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	const options = useSettingLookupOptions(lookupEndpoint);

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
					options={options.map(({ key, label }) => [key, label])}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default LookupSettingInput;
