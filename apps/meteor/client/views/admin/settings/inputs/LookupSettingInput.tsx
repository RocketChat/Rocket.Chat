import { Box, FieldLabel, FieldRow, Flex, Select } from '@rocket.chat/fuselage';
import type { PathPattern } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import React from 'react';

import type { AsyncState } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import ResetSettingButton from '../ResetSettingButton';

type LookupSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	lookupEndpoint: PathPattern extends `/${infer U}` ? U : PathPattern;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function LookupSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	lookupEndpoint,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: LookupSettingInputProps): ReactElement {
	const handleChange = (value: string): void => {
		onChangeValue?.(value);
	};

	const { value: options } = useEndpointData(lookupEndpoint) as AsyncState<{ data: { key: string; label: string }[] }>;
	const values = options?.data || [];

	return (
		<>
			<Flex.Container>
				<Box>
					<FieldLabel htmlFor={_id} title={_id}>
						{label}
					</FieldLabel>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<FieldRow>
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={(value) => handleChange(String(value))}
					options={values.map(({ key, label }) => [key, label])}
				/>
			</FieldRow>
		</>
	);
}

export default LookupSettingInput;
