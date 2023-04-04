import { Box, Field, Flex } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';
import CodeMirror from './CodeMirror';
import CodeMirrorBox from './CodeMirror/CodeMirrorBox';

type CodeSettingInputProps = {
	_id: string;
	label: string;
	hint: string;
	value?: string;
	code: string;
	placeholder?: string;
	readonly: boolean;
	autocomplete: boolean;
	disabled: boolean;
	hasResetButton: boolean;
	onChangeValue: (value: string) => void;
	onResetButtonClick: () => void;
};

function CodeSettingInput({
	_id,
	label,
	hint,
	value = '',
	code,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: CodeSettingInputProps): ReactElement {
	const handleChange = (value: string): void => {
		onChangeValue(value);
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
				{hint && <Field.Hint>{hint}</Field.Hint>}
			</Flex.Container>
			<CodeMirrorBox label={label}>
				<CodeMirror
					data-qa-setting-id={_id}
					id={_id}
					mode={code}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
			</CodeMirrorBox>
		</>
	);
}

export default CodeSettingInput;
