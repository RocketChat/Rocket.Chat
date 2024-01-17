import { Field, FieldLabel, FieldRow, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type StringSettingInputProps = {
	_id: string;
	label: string;
	name?: string;
	value?: string;
	multiline?: boolean;
	placeholder?: string;
	readonly?: boolean;
	error?: string;
	autocomplete?: boolean;
	disabled?: boolean;
	required?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function StringSettingInput({
	_id,
	label,
	name,
	disabled,
	required,
	multiline,
	placeholder,
	readonly,
	error,
	autocomplete,
	value,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: StringSettingInputProps): ReactElement {
	const handleChange: EventHandler<SyntheticEvent<HTMLInputElement>> = (event) => {
		onChangeValue?.(event.currentTarget.value);
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
				{multiline ? (
					<TextAreaInput
						data-qa-setting-id={_id}
						id={_id}
						name={name}
						rows={4}
						value={value}
						placeholder={placeholder}
						disabled={disabled}
						readOnly={readonly}
						error={error}
						autoComplete={autocomplete === false ? 'off' : undefined}
						onChange={handleChange}
					/>
				) : (
					<TextInput
						data-qa-setting-id={_id}
						id={_id}
						value={value}
						name={name}
						placeholder={placeholder}
						disabled={disabled}
						readOnly={readonly}
						autoComplete={autocomplete === false ? 'off' : undefined}
						error={error}
						onChange={handleChange}
					/>
				)}
			</FieldRow>
		</Field>
	);
}

export default StringSettingInput;
