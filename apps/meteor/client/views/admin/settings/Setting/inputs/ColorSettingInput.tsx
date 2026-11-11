import type { SettingEditor } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, FieldLabel, FieldRow, FieldHint, InputBox, TextInput, Select, Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, Key } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

// The value input takes twice the room the editor select takes
const editorRow = css`
	& > .rcx-input-box[class][class] {
		flex-grow: 2;
	}
`;

export type ColorSettingInputProps = SettingInputProps & {
	value: string;
	editor: string;
	allowedTypes?: TranslationKey[];
};

function ColorSettingInput({
	_id,
	label,
	value,
	hint,
	editor,
	allowedTypes = [],
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onChangeEditor,
	onResetButtonClick,
}: ColorSettingInputProps) {
	const { t } = useTranslation();

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			onChangeValue?.(event.currentTarget.value);
		},
		[onChangeValue],
	);

	const handleEditorTypeChange = useCallback(
		(value: Key) => {
			onChangeEditor?.(value as SettingEditor);
		},
		[onChangeEditor],
	);

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<Box display='flex' flexGrow={1} gap='x8' className={editorRow}>
					{editor === 'color' && (
						<InputBox
							type='color'
							id={_id}
							value={value}
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleChange}
						/>
					)}
					{editor === 'expression' && (
						<TextInput
							id={_id}
							value={value}
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleChange}
						/>
					)}
					<Select
						id={`${_id}_editor`}
						aria-label={t('Setting_color_editor', { setting: label })}
						value={editor}
						disabled={disabled}
						onChange={handleEditorTypeChange}
						options={allowedTypes.map((type) => [type, t(type)])}
					/>
				</Box>
			</FieldRow>
			<FieldHint>Variable name: {_id.replace(/theme-color-/, '@')}</FieldHint>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default ColorSettingInput;
