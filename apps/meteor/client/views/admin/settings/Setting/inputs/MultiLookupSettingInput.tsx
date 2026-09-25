import { FieldLabel, MultiSelectFiltered, Field, FieldRow, FieldHint } from '@rocket.chat/fuselage';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';
import type { SettingLookupEndpoint } from '../../hooks/useSettingLookupOptions';
import { useSettingLookupOptions } from '../../hooks/useSettingLookupOptions';

export type MultiLookupSettingInputProps = SettingInputProps<string[], string[]> & {
	lookupEndpoint: SettingLookupEndpoint;
};

function MultiLookupSettingInput({
	_id,
	label,
	value = [],
	hint,
	placeholder,
	readonly,
	disabled,
	required,
	lookupEndpoint,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: MultiLookupSettingInputProps) {
	const options = useSettingLookupOptions(lookupEndpoint);

	const handleChange = (value: string[]): void => {
		onChangeValue?.(value);
	};

	const optionPairs: [string, string][] = [
		...options.map(({ key, label }): [string, string] => [key, label]),
		...value.filter((stored) => !options.some(({ key }) => key === stored)).map((stored): [string, string] => [stored, stored]),
	];

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<MultiSelectFiltered
					max-width='full'
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					onChange={handleChange}
					options={optionPairs}
					aria-label={typeof label === 'string' ? label : _id}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default MultiLookupSettingInput;
