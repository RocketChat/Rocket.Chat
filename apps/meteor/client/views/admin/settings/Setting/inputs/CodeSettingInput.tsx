import { FieldLabel, FieldHint, FieldRow, Field } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import CodeMirror from './CodeMirror';
import CodeMirrorBox from './CodeMirror/CodeMirrorBox';
import type { SettingInputProps } from './types';

type CodeSettingInputProps = SettingInputProps & {
	hint: string;
	code: string;
	readonly: boolean;
	disabled: boolean;
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
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: CodeSettingInputProps): ReactElement {
	const handleChange = (value: string): void => {
		onChangeValue(value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
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
		</Field>
	);
}

export default CodeSettingInput;
