import type { SettingEditor } from '@rocket.chat/core-typings';
import { FieldLabel, FieldRow, FieldHint, Flex, InputBox, Margins, TextInput, Select, Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, Key, ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type ColorSettingInputProps = SettingInputProps & {
	value: string;
	editor: string;
	allowedTypes?: TranslationKey[];
};

function ColorSettingInput({
	_id,
	label,
	value,
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
}: ColorSettingInputProps): ReactElement {
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
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
			<Margins inline={4}>
				<FieldRow>
					<Margins inline={4}>
						<Flex.Item grow={2}>
							{editor === 'color' && (
								<InputBox
									data-qa-setting-id={_id}
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
									data-qa-setting-id={_id}
									id={_id}
									value={value}
									placeholder={placeholder}
									disabled={disabled}
									readOnly={readonly}
									autoComplete={autocomplete === false ? 'off' : undefined}
									onChange={handleChange}
								/>
							)}
						</Flex.Item>
						<Select
							data-qa-setting-id={`${_id}_editor`}
							type='color'
							id={`${_id}_editor`}
							value={editor}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleEditorTypeChange}
							options={allowedTypes.map((type) => [type, t(type)])}
						/>
					</Margins>
				</FieldRow>
			</Margins>
			<FieldHint>Variable name: {_id.replace(/theme-color-/, '@')}</FieldHint>
		</Field>
	);
}

export default ColorSettingInput;
