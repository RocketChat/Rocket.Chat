import {
	Box,
	Field,
	Flex,
	SelectInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

export function SelectSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const t = useTranslation();

	const handleChange = ([value]) => {
		onChangeValue && onChangeValue(value);
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
				{values.map(({ key, i18nLabel }) =>
					<SelectInput.Option key={key} value={key}>{t(i18nLabel)}</SelectInput.Option>,
				)}
			</SelectInput>
		</Field.Row>
		{/* <Select
			data-qa-setting-id={_id}
			id={_id}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			onChange={handleChange}
			option={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)],
			)}
		/> */}
	</>;
}
