import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import type keys from '../../../../../packages/rocketchat-i18n/i18n/en.i18n.json';
import ResetSettingButton from '../ResetSettingButton';

type SelectSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	values?: { key: string; i18nLabel: keyof typeof keys }[];
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function SelectSettingInput({
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
}: SelectSettingInputProps): ReactElement {
	const t = useTranslation();

	const handleChange = (value: string): void => {
		onChangeValue?.(value);
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
					options={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)])}
				/>
			</Field.Row>
		</>
	);
}

export default SelectSettingInput;
