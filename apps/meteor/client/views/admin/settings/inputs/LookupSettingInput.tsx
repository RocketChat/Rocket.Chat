import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
import type { PathFor } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import React from 'react';

import type { AsyncState } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import ResetSettingButton from '../ResetSettingButton';

type LookupSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	lookupEndpoint: PathFor<'GET'>;
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
					options={values.map(({ key, label }) => [key, label])}
				/>
			</Field.Row>
		</>
	);
}

export default LookupSettingInput;
