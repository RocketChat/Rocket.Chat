import { Box, Button, FieldError, FieldRow, InputBoxSkeleton, MultiSelect, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AdminABACRoomFormData } from './AdminABACRoomForm';
import useABACAttributeList from './hooks/useABACAttributeList';

type ABACAttributeAutocompleteProps = {
	onRemove: () => void;
	index: number;
};

const ABACAttributeField = ({ onRemove, index }: ABACAttributeAutocompleteProps) => {
	const {
		formState: { errors },
		control,
		getValues,
		setValue,
	} = useFormContext<AdminABACRoomFormData>();
	const currentAttribute = useWatch({ control, name: `attributes.${index}.key` });
	const { t } = useTranslation();
	const [filter, setFilter] = useState<string>();
	const filterDebounced = useDebouncedValue(filter, 300);

	const { data: options, fetchNextPage, isLoading } = useABACAttributeList(filterDebounced || undefined);

	const selectedAttribute = options.find((option) => option.value === currentAttribute);

	const validateRepeatedAttributes = useCallback(
		(value: string) => {
			const attributes = getValues('attributes');
			// Only one instance of the same attribute is allowed to be in the form at a time
			const repeatedAttributes = attributes.filter((attribute) => attribute.key === value && attribute.key !== currentAttribute).length > 1;
			return repeatedAttributes ? t('ABAC_No_repeated_attributes') : undefined;
		},
		[currentAttribute, getValues, t],
	);

	const valueOptions: [string, string][] = useMemo(() => {
		if (!selectedAttribute?.attributeValues) {
			return [];
		}
		return selectedAttribute.attributeValues.map((value) => [value, value]);
	}, [selectedAttribute]);

	if (isLoading) {
		return <InputBoxSkeleton />;
	}
	return (
		<Box display='flex' flexDirection='column' w='full'>
			<FieldRow>
				<Controller
					name={`attributes.${index}.key`}
					control={control}
					rules={{ required: t('Required_field', { field: t('Attribute') }), validate: validateRepeatedAttributes }}
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
							error={errors.attributes?.[index]?.key?.message}
						/>
					)}
				/>
			</FieldRow>
			<FieldError>{errors.attributes?.[index]?.key?.message || ''}</FieldError>

			<FieldRow>
				<Controller
					name={`attributes.${index}.values`}
					control={control}
					rules={{ required: t('Required_field', { field: t('Attribute_Values') }) }}
					render={({ field }) => (
						<MultiSelect
							{...field}
							options={valueOptions}
							placeholder={t('ABAC_Select_Attribute_Values')}
							error={errors.attributes?.[index]?.values?.message}
						/>
					)}
				/>
			</FieldRow>
			<FieldError>{errors.attributes?.[index]?.values?.message || ''}</FieldError>

			<Button onClick={onRemove} title={t('Remove')} mbs={4}>
				{t('Remove')}
			</Button>
		</Box>
	);
};

export default ABACAttributeField;
