import { Box, Field, Flex, SelectInput } from '@rocket.chat/fuselage';
import React from 'react';

import { useLanguages } from '../../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

export function LanguageSettingInput({
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

	const handleChange = (event) => {
		onChangeValue(event.currentTarget.value);
	};

	return <>
		<Flex.Container>
			<Box>
				<Field.Label htmlFor={_id} title={_id}>{label}</Field.Label>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</Box>
		</Flex.Container>
		<Field.Row>
			<SelectInput
				data-qa-setting-id={_id}
				id={_id}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			>
				{languages.map(({ key, name }) =>
					<SelectInput.Option key={key} value={key} dir='auto'>{name}</SelectInput.Option>,
				)}
			</SelectInput>
		</Field.Row>
	</>;
}
