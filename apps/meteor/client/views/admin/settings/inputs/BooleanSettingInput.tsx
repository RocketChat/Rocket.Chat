import { Field, ToggleSwitch } from '@rocket.chat/fuselage';
import React, { ReactElement, SyntheticEvent } from 'react';

import ResetSettingButton from '../ResetSettingButton';

type BooleanSettingInputProps = {
	_id: string;
	label: string;
	disabled: boolean;
	readonly: boolean;
	value: boolean;
	hasResetButton: boolean;
	onChangeValue: (value: boolean) => void;
	onResetButtonClick: () => void;
};
function BooleanSettingInput({
	_id,
	label,
	disabled,
	readonly,
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
		<Field.Row>
			<ToggleSwitch
				data-qa-setting-id={_id}
				id={_id}
				value='true'
				checked={value === true}
				disabled={disabled}
				readOnly={readonly}
				onChange={handleChange}
			/>
			<Field.Label htmlFor={_id} title={_id}>
				{label}
			</Field.Label>
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
	);
}

export default BooleanSettingInput;
