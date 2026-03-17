import { Field, FieldHint, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type IntSettingInputProps = SettingInputProps<string, string | number> & {
	value: string;
};

function IntSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	onChangeValue,
	hasResetButton,
	onResetButtonClick,
}: IntSettingInputProps): ReactElement {
	const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
		onChangeValue?.(parseInt(event.currentTarget.value, 10));
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
				<InputBox
					id={_id}
					type='number'
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

export default IntSettingInput;
