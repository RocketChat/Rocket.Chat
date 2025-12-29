import { Field, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type GenericSettingInputProps = SettingInputProps & {
	value: string;
};

function GenericSettingInput({
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
}: GenericSettingInputProps): ReactElement {
	const handleChange: FormEventHandler<HTMLInputElement> = (event): void => {
		onChangeValue?.(event.currentTarget.value);
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
				<TextInput
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default GenericSettingInput;
