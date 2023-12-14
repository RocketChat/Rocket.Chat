import { Field, FieldLabel, FieldRow, PasswordInput } from '@rocket.chat/fuselage';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type PasswordSettingInputProps = {
	_id: string;
	label: string;
	value?: string | number | readonly string[] | undefined;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	required?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function PasswordSettingInput({
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
}: PasswordSettingInputProps): ReactElement {
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
				<PasswordInput
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'new-password' : undefined}
					onChange={handleChange}
				/>
			</FieldRow>
		</Field>
	);
}

export default PasswordSettingInput;
