import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useLanguages } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type LanguageSettingInputProps = {
	_id: string;
	label: ReactNode;
	value: string;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	required?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string | number) => void;
	onResetButtonClick?: () => void;
};

function LanguageSettingInput({
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
}: LanguageSettingInputProps): ReactElement {
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
					options={languages.map(({ key, name }) => [key, name])}
				/>
			</FieldRow>
		</Field>
	);
}

export default LanguageSettingInput;
