import { Box, Field, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage';
import type { ReactElement, SyntheticEvent } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type BooleanSettingInputProps = SettingInputProps<boolean>;

function BooleanSettingInput({
	_id,
	label,
	disabled,
	readonly,
	required,
	value,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: BooleanSettingInputProps): ReactElement {
	const handleChange = (event: SyntheticEvent<HTMLInputElement>): void => {
		const value = event.currentTarget.checked;
		onChangeValue?.(value);
	};

	return (
		<Field>
			<FieldRow marginBlockEnd={8}>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				<Box display='flex' alignItems='center'>
					{hasResetButton && <ResetSettingButton mie={8} data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
					<ToggleSwitch
						data-qa-setting-id={_id}
						id={_id}
						checked={value === true}
						disabled={disabled || readonly}
						onChange={handleChange}
					/>
				</Box>
			</FieldRow>
		</Field>
	);
}

export default BooleanSettingInput;
