import { Field, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useLanguages } from '@rocket.chat/ui-contexts';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

export type LanguageSettingInputProps = SettingInputProps<string, string | number>;

function LanguageSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: LanguageSettingInputProps) {
	const languages = useLanguages();

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
					onChange={(value) => handleChange(String(value))}
					options={languages.map(({ key, name }) => [key, name])}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default LanguageSettingInput;
