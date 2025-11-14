import { Box, Button, MultiSelect, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import useABACAttributeList from './hooks/useABACAttributeList';

type ABACAttributeAutocompleteProps = {
	value: string;
	onChange: (value: string) => void;
	onRemove: () => void;
	control: Control;
	index: number;
	setValue: (key: string, value: string[]) => void;
};

const ABACAttributeAutocomplete = ({ onRemove, control, index, setValue }: ABACAttributeAutocompleteProps) => {
	const watch = useWatch({ control, name: `attributes.${index}.key` });
	const { t } = useTranslation();
	const [filter, setFilter] = useState<string>();
	const filterDebounced = useDebouncedValue(filter, 300);

	const { data: options, fetchNextPage } = useABACAttributeList(filterDebounced || undefined);
	const selectedAttribute = options.find((option) => option.value === watch);

	const valueOptions: [string, string][] = useMemo(() => {
		if (!selectedAttribute?.attributeValues) {
			return [];
		}
		return selectedAttribute.attributeValues.map((value) => [value, value]);
	}, [selectedAttribute]);

	return (
		<Box display='flex' flexDirection='column' w='full'>
			<Controller
				name={`attributes.${index}.key`}
				control={control}
				render={({ field }) => (
					<PaginatedSelectFiltered
						{...field}
						onChange={(val) => {
							setValue(`attributes.${index}.values`, []);
							field.onChange(val);
						}}
						filter={filter}
						setFilter={setFilter as (value: string | number | undefined) => void}
						options={options}
						endReached={() => fetchNextPage()}
						placeholder={t('ABAC_Search_Attribute')}
						mbe={4}
					/>
				)}
			/>

			<Controller
				name={`attributes.${index}.values`}
				control={control}
				render={({ field }) => <MultiSelect {...field} options={valueOptions} placeholder={t('ABAC_Select_Attribute_Values')} />}
			/>

			<Button onClick={onRemove} title={t('Remove')} mbs={4}>
				{t('Remove')}
			</Button>
		</Box>
	);
};

export default ABACAttributeAutocomplete;
