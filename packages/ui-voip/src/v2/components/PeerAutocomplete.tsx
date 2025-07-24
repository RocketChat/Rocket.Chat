import { AutoComplete, Option, Avatar, Field, FieldRow, FieldDescription } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type PeerAutocompleteOptions = {
	value: string; // user id
	label: string; // name or username
	identifier?: string | number; // extension number
	avatarUrl?: string;
};

type PeerAutocompleteProps = {
	data: PeerAutocompleteOptions[];
	onChangeValue: (value: string, type: 'internal' | 'external') => void;
	onChangeFilter: (filter: string) => void;
};

const PREFIX_FIRST_OPTION = 'rcx-first-option-';

const getFirstOption = (filter: string) => {
	return { value: `${PREFIX_FIRST_OPTION}${filter}`, label: filter };
};

const isFirstOption = (value: string) => {
	return value.startsWith(PREFIX_FIRST_OPTION);
};

const PeerAutocomplete = ({ data, onChangeValue, onChangeFilter }: PeerAutocompleteProps) => {
	const { t } = useTranslation();

	const [filter, setFilter] = useState<string>('');
	const [value, setValue] = useState<string | undefined>();

	const debouncedFilter = useDebouncedValue(filter, 400);
	useEffect(() => {
		onChangeFilter(debouncedFilter);
	}, [debouncedFilter, onChangeFilter]);

	const onChange = useCallback(
		(v: string | string[]) => {
			if (Array.isArray(v)) {
				return;
			}

			setValue(v);
			if (isFirstOption(v)) {
				onChangeValue(v.replace(PREFIX_FIRST_OPTION, ''), 'external');
				return;
			}
			onChangeValue(v, 'internal');
		},
		[onChangeValue],
	);

	const options = useMemo<PeerAutocompleteOptions[]>(() => {
		if (debouncedFilter.length > 0) {
			return [getFirstOption(debouncedFilter), ...data];
		}

		return data;
	}, [data, debouncedFilter]);

	const id = useId();

	return (
		<Field>
			<FieldRow>
				<AutoComplete
					aria-labelledby={id}
					setFilter={setFilter}
					filter={filter}
					onChange={onChange}
					options={options}
					value={value}
					renderItem={({ value, label, ...props }) => {
						if (isFirstOption(value)) {
							return <Option key={value} label={label} icon='phone-out' {...props} />;
						}
						const thisOption = options.find((option) => option.value === value);
						return <Option key={value} label={label} avatar={<Avatar size='x20' url={thisOption?.avatarUrl || ''} />} {...props} />;
					}}
					renderSelected={() => null}
				/>
			</FieldRow>
			<FieldDescription id={id}>{t('Enter_username_or_number')}</FieldDescription>
		</Field>
	);
};

export default PeerAutocomplete;
