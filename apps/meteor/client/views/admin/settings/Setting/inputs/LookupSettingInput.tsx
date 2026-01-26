import { Field, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { PathPattern } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';
import { miscQueryKeys } from '../../../../../lib/queryKeys';

type LookupSettingInputProps = SettingInputProps & {
	lookupEndpoint: PathPattern extends `/${infer U}` ? U : PathPattern;
};

function LookupSettingInput({
	_id,
	label,
	value,
	hint,
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

	const lookup = useEndpoint('GET', lookupEndpoint) as unknown as () => Promise<{ data: { key: string; label: string }[] }>;
	const { data: values = [] } = useQuery({
		queryKey: miscQueryKeys.lookup(lookupEndpoint),
		queryFn: async () => {
			const { data = [] } = (await lookup()) ?? {};
			return data as { key: string; label: string }[];
		},
	});

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<Select
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
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default LookupSettingInput;
