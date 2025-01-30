import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { PathPattern } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';

import type { AsyncState } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type LookupSettingInputProps = SettingInputProps & {
	lookupEndpoint: PathPattern extends `/${infer U}` ? U : PathPattern;
};

function LookupSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
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
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
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
		</Field>
	);
}

export default LookupSettingInput;
