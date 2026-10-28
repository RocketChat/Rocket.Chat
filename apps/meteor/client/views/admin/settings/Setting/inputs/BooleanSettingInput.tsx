import { Box, Field, FieldHint, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import type { ChangeEvent } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

export type BooleanSettingInputProps = SettingInputProps<boolean>;

function BooleanSettingInput({
	_id,
	label,
	disabled,
	readonly,
	required,
	value,
	hint,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: BooleanSettingInputProps) {
	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const value = event.currentTarget.checked;
		onChangeValue?.(value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				<Box display='flex' alignItems='center' gap={8}>
					{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
					<ToggleSwitch id={_id} checked={value === true} disabled={disabled || readonly} onChange={handleChange} />
				</Box>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default BooleanSettingInput;
