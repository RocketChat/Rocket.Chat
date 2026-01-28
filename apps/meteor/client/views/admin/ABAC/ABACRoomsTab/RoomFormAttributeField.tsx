import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Button, FieldError, FieldRow, MultiSelect, SelectFiltered } from '@rocket.chat/fuselage';
import { useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RoomFormData } from './RoomForm';

type ABACAttributeAutocompleteProps = {
	labelId: string;
	onRemove: () => void;
	index: number;
	attributeList: { value: string; label: string; attributeValues: string[] }[];
	required?: boolean;
};

const RoomFormAttributeField = ({ labelId, onRemove, index, attributeList, required = false }: ABACAttributeAutocompleteProps) => {
	const { t } = useTranslation();

	const { control, getValues, resetField } = useFormContext<RoomFormData>();

	const options: SelectOption[] = useMemo(() => attributeList.map((attribute) => [attribute.value, attribute.label]), [attributeList]);

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

		const selectedAttributeData = attributeList.find((option) => option.value === keyField.value);

		return selectedAttributeData?.attributeValues.map((value) => [value, value]) || [];
	}, [attributeList, keyField.value]);

	return (
		<Box display='flex' flexDirection='column' w='full'>
			<FieldRow>
				<SelectFiltered
					{...keyField}
					options={options}
					required={required}
					aria-required={required}
					aria-labelledby={labelId}
					aria-invalid={keyFieldState.error ? 'true' : 'false'}
					aria-describedby={keyFieldState.error ? `${keyField.name}-error` : undefined}
					placeholder={t('ABAC_Search_Attribute')}
					mbe={4}
					error={keyFieldState.error?.message}
					withTruncatedText
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
				<MultiSelect
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
