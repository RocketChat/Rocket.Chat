import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
import React from 'react';

import { useLanguages } from '../../../../contexts/TranslationContext';
import ResetSettingButton from '../ResetSettingButton';

function LanguageSettingInput({
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
}) {
	const languages = useLanguages();

	const handleChange = (value) => {
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
			</Flex.Container>
			<Field.Row>
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					options={languages.map(({ key, name }) => [key, name])}
				/>
			</Field.Row>
		</>
	);
}

export default LanguageSettingInput;
