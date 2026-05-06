import { Box, Button, FieldError, FieldRow, MultiSelectFiltered, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useCallback, useMemo, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RoomFormData } from './RoomForm';
import type { AttributeKeyOption } from '../hooks/useAttributeList';
import { useAttributeKeysList, useResolveSavedAttribute } from '../hooks/useAttributeList';

type ABACAttributeAutocompleteProps = {
	labelId: string;
	onRemove: () => void;
	index: number;
	required?: boolean;
};

const RoomFormAttributeField = ({ labelId, onRemove, index, required = false }: ABACAttributeAutocompleteProps) => {
	const { t } = useTranslation();

	const { control, getValues, resetField } = useFormContext<RoomFormData>();

	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const { data: attributeItems = [], fetchNextPage } = useAttributeKeysList(debouncedFilter);

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

	const resolvedAttribute = useResolveSavedAttribute(keyField.value);

	const options = useMemo<AttributeKeyOption[]>(() => {
		if (!resolvedAttribute || attributeItems.some((item) => item.value === resolvedAttribute.value)) {
			return attributeItems;
		}
		return [...attributeItems, resolvedAttribute];
	}, [attributeItems, resolvedAttribute]);

	const valueOptions: [string, string][] = useMemo(() => {
		if (!keyField.value) {
			return [];
		}

		const selected = options.find((option) => option.value === keyField.value);

		return selected?.attributeValues.map((value) => [value, value]) || [];
	}, [options, keyField.value]);

	return (
		<Box display='flex' flexDirection='column' w='full'>
			<FieldRow>
				<PaginatedSelectFiltered
					{...keyField}
					filter={filter}
					setFilter={setFilter as (value: string | number | undefined) => void}
					options={options}
					required={required}
					aria-required={required}
					aria-labelledby={labelId}
					aria-invalid={keyFieldState.error ? 'true' : 'false'}
					aria-describedby={keyFieldState.error ? `${keyField.name}-error` : undefined}
					placeholder={t('ABAC_Search_Attribute')}
					mbe={4}
					error={keyFieldState.error?.message}
					withTitle
					endReached={() => fetchNextPage()}
					onChange={(value) => {
						keyField.onChange(value);
						resetField(`attributes.${index}.values`, { defaultValue: [] });
					}}
				/>
			</FieldRow>
			{keyFieldState.error && (
				<FieldError id={`${keyField.name}-error`} role='alert'>
					{keyFieldState.error.message}
				</FieldError>
			)}
			<FieldRow>
				<MultiSelectFiltered
					required={required}
					aria-required={required}
					aria-labelledby={labelId}
					aria-invalid={valuesFieldState.error ? 'true' : 'false'}
					aria-describedby={valuesFieldState.error ? `${valuesField.name}-error` : undefined}
					withTruncatedText
					{...valuesField}
					options={valueOptions}
					placeholder={t('ABAC_Select_Attribute_Values')}
					error={valuesFieldState.error?.message}
				/>
			</FieldRow>
			{valuesFieldState.error && (
				<FieldError id={`${valuesField.name}-error`} role='alert'>
					{valuesFieldState.error.message}
				</FieldError>
			)}
			{index !== 0 && (
				<Button onClick={onRemove} title={t('Remove')} mbs={8}>
					{t('Remove')}
				</Button>
			)}
		</Box>
	);
};

export default RoomFormAttributeField;
