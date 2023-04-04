import { Box, Field, Flex, TextInput } from '@rocket.chat/fuselage';
import type { FormEventHandler, ReactElement } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type GenericSettingInputProps = {
	_id: string;
	label: string;
	value: string;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};
function GenericSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: GenericSettingInputProps): ReactElement {
	const handleChange: FormEventHandler<HTMLInputElement> = (event): void => {
		onChangeValue?.(event.currentTarget.value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<Field.Row>
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
			</Field.Row>
		</>
	);
}

export default GenericSettingInput;
