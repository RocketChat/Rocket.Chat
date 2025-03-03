import { Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type FontSettingInputProps = SettingInputProps & {
	value: string;
};

function FontSettingInput({
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
}: FontSettingInputProps): ReactElement {
	const handleChange: FormEventHandler<HTMLInputElement> = (event): void => {
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
				<TextInput
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
			</FieldRow>
		</Field>
	);
}

export default FontSettingInput;
