import { Box, Button, FieldError, FieldRow, InputBoxSkeleton, MultiSelect, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RoomFormData } from './RoomForm';
import { useAttributeList } from '../hooks/useAttributeList';

type ABACAttributeAutocompleteProps = {
	onRemove: () => void;
	index: number;
};

const RoomFormAttributeField = ({ onRemove, index }: ABACAttributeAutocompleteProps) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState<string>();
	const filterDebounced = useDebouncedValue(filter, 300);

	const { control, getValues, resetField } = useFormContext<RoomFormData>();

	const { data: options, fetchNextPage, isLoading } = useAttributeList(filterDebounced || undefined);

	const validateRepeatedAttributes = useCallback(
		(value: string) => {
			const attributes = getValues('attributes');
			// Only one instance of the same attribute is allowed to be in the form at a time
			const repeatedAttributes = attributes.filter((attribute) => attribute.key === value).length > 1;
			return repeatedAttributes ? t('ABAC_No_repeated_attributes') : undefined;
		},
		[getValues, t],
	);

	const { field: keyField, fieldState: keyFieldState } = useController({
		name: `attributes.${index}.key`,
		control,
		rules: {
			required: t('Required_field', { field: t('Attribute') }),
			validate: validateRepeatedAttributes,
		},
	});

	const { field: valuesField, fieldState: valuesFieldState } = useController({
		name: `attributes.${index}.values`,
		control,
		rules: { required: t('Required_field', { field: t('Attribute_Values') }) },
	});

	const valueOptions: [string, string][] = useMemo(() => {
		if (!keyField.value) {
			return [];
		}

		const selectedAttributeData = options.find((option) => option.value === keyField.value);

		return selectedAttributeData?.attributeValues.map((value) => [value, value]) || [];
	}, [keyField.value, options]);

	if (isLoading) {
		return <InputBoxSkeleton />;
	}
	return (
		<Box display='flex' flexDirection='column' w='full'>
			<FieldRow>
				<PaginatedSelectFiltered
					{...keyField}
					onChange={(val) => {
						resetField(`attributes.${index}.values`);
						keyField.onChange(val);
					}}
					filter={filter}
					setFilter={setFilter as (value: string | number | undefined) => void}
					options={options}
					endReached={() => fetchNextPage()}
					placeholder={t('ABAC_Search_Attribute')}
					mbe={4}
					error={keyFieldState.error?.message}
				/>
			</FieldRow>
			<FieldError>{keyFieldState.error?.message || ''}</FieldError>

			<FieldRow>
				<MultiSelect
					{...valuesField}
					options={valueOptions}
					placeholder={t('ABAC_Select_Attribute_Values')}
					error={valuesFieldState.error?.message}
				/>
			</FieldRow>
			<FieldError>{valuesFieldState.error?.message || ''}</FieldError>

			<Button onClick={onRemove} title={t('Remove')} mbs={4}>
				{t('Remove')}
			</Button>
		</Box>
	);
};

export default RoomFormAttributeField;
