import { FieldLabel, MultiSelectFiltered, Field, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { PathPattern } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';
import { miscQueryKeys } from '../../../../../lib/queryKeys';

export type MultiLookupSettingInputProps = SettingInputProps<string[], string[]> & {
	lookupEndpoint: PathPattern extends `/${infer U}` ? U : PathPattern;
};

/**
 * Multi-value counterpart of `LookupSettingInput` — options are fetched from `lookupEndpoint`
 * rather than declared statically at registration, for settings whose choices are workspace data
 * (e.g. the ABAC attribute registry) rather than a fixed list.
 */
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
	const lookup = useEndpoint('GET', lookupEndpoint) as unknown as () => Promise<{ data: { key: string; label: string }[] }>;

	const { data: options = [] } = useQuery({
		queryKey: miscQueryKeys.lookup(lookupEndpoint),
		queryFn: async () => {
			const { data = [] } = (await lookup()) ?? {};
			return data as { key: string; label: string }[];
		},
	});

	const handleChange = (value: string[]): void => {
		onChangeValue?.(value);
	};

	// A stored value whose option has since been deleted must stay visible and removable, so the
	// selectable options are the union of what the endpoint returns and what is already stored.
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
					aria-label={_id}
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default MultiLookupSettingInput;
