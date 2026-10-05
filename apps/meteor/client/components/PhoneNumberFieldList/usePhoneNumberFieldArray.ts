import { useCallback } from 'react';
import type { ArrayPath, Control, FieldArray, FieldValues } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import type { PhoneFieldType } from './PhoneNumberFieldList';
import { EMPTY_PHONE } from './phoneNumbers';

export const usePhoneNumberFieldArray = <T extends FieldValues>(control: Control<T>, name: ArrayPath<T>) => {
	const { fields, append, remove, update } = useFieldArray<T>({ control, name });
	const phones = fields as unknown as PhoneFieldType[];

	const onAddPhone = useCallback((phone: Omit<PhoneFieldType, 'id'>) => append(phone as FieldArray<T, ArrayPath<T>>), [append]);

	const onRemovePhone = useCallback(
		(index: number) => {
			if (phones.length > 1) {
				remove(index);
				return;
			}

			update(index, { ...EMPTY_PHONE } as FieldArray<T, ArrayPath<T>>);
		},
		[phones.length, remove, update],
	);

	return { phones, onAddPhone, onRemovePhone };
};
