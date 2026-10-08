import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Field, FieldGroup, FieldLabel, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeField from '../../../views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField';
import AbacErrorCallout from '../AbacErrorCallout';

const MAX_ATTRIBUTES = 10;

export type AbacAttributesFormData = {
	attributes: IAbacAttributeDefinition[];
};

export const findMissingRequiredKeys = (requiredKeys: string[], assignable: IAbacAttributeDefinition[] = []): string[] =>
	requiredKeys.filter((key) => !assignable.some((attribute) => attribute.key === key));

export const toAttributeMap = (attributes: IAbacAttributeDefinition[]): Record<string, string[]> =>
	Object.fromEntries(attributes.filter(({ key, values }) => key && values.length).map(({ key, values }) => [key, values]));

type AbacAttributesStepProps = {
	requiredKeys: string[];
	assignable?: IAbacAttributeDefinition[];
	isPending: boolean;
	error: unknown;
	assignabilityError: unknown;
	showTitle?: boolean;
};

const AbacAttributesStep = ({
	requiredKeys,
	assignable,
	isPending,
	error,
	assignabilityError,
	showTitle = true,
}: AbacAttributesStepProps) => {
	const { t } = useTranslation();
	const { control, getValues } = useFormContext<AbacAttributesFormData>();
	const { fields, append, prepend, remove } = useFieldArray({ control, name: 'attributes' });
	const attributes = useWatch({ control, name: 'attributes' });

	useEffect(() => {
		const keys = getValues('attributes').map(({ key }) => key);
		const missingRows = requiredKeys.filter((key) => !keys.includes(key)).map((key) => ({ key, values: [] }));

		if (missingRows.length > 0) {
			prepend(missingRows, { shouldFocus: false });
		}
	}, [requiredKeys, getValues, prepend]);

	const attributeList = useMemo(
		() => (assignable ?? []).map(({ key, values }) => ({ value: key, label: key, attributeValues: values })),
		[assignable],
	);

	if (isPending) {
		return <InputBoxSkeleton />;
	}

	if (error) {
		return <AbacErrorCallout error={error} fallback='ABAC_Assignable_Attributes_Unavailable' />;
	}

	const missingRequiredKeys = findMissingRequiredKeys(requiredKeys, assignable);

	return (
		<FieldGroup>
			{showTitle && (
				<Box is='h5' fontScale='h5' color='titles-labels'>
					{t('ABAC_Room_Attributes')}
				</Box>
			)}
			{missingRequiredKeys.length > 0 && (
				<Callout type='danger' role='alert'>
					{t('ABAC_Required_Attributes_Not_Held', { attributes: missingRequiredKeys.join(', ') })}
				</Callout>
			)}
			{fields.map((field, index) => {
				const rowKey = attributes?.[index]?.key ?? field.key;
				const isRequiredRow = requiredKeys.includes(rowKey) && (attributes ?? []).findIndex(({ key }) => key === rowKey) === index;

				return (
					<Field key={field.id}>
						<FieldLabel id={field.id} required={index === 0 || isRequiredRow}>
							{t('Attribute')}
						</FieldLabel>
						<RoomFormAttributeField
							labelId={field.id}
							attributeList={attributeList}
							required={index === 0 || isRequiredRow}
							lockKey={isRequiredRow}
							removable={!isRequiredRow}
							onRemove={() => remove(index)}
							index={index}
						/>
					</Field>
				);
			})}
			<Button onClick={() => append({ key: '', values: [] })} disabled={fields.length >= MAX_ATTRIBUTES}>
				{t('ABAC_Add_Attribute')}
			</Button>
			{assignabilityError ? <AbacErrorCallout error={assignabilityError} fallback='ABAC_Assignable_Attributes_Unavailable' /> : null}
		</FieldGroup>
	);
};

export default AbacAttributesStep;
