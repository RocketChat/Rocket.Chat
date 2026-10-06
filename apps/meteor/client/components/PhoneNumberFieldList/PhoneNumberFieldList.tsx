import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useId } from 'react';
import { useVisuallyHidden } from 'react-aria';
import type { Control } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PhoneNumberFieldRow from './PhoneNumberFieldRow';
import type { PhoneNumbersFormValues } from './phoneNumbers';
import { EMPTY_PHONE } from './phoneNumbers';

type PhoneNumberFieldListProps<T extends { phones?: IUserPhoneNumber[] }> = {
	control: Control<T>;
	className?: string;
};

// Edits the form's `phones` array, always keeping at least one (possibly blank) row on screen.
const PhoneNumberFieldList = <T extends { phones?: IUserPhoneNumber[] }>({ control, className }: PhoneNumberFieldListProps<T>) => {
	const { t } = useTranslation();
	const { visuallyHiddenProps } = useVisuallyHidden();
	const listId = useId();

	const phonesControl = control as unknown as Control<PhoneNumbersFormValues>;
	const { fields, append, remove, update } = useFieldArray({ control: phonesControl, name: 'phones' });

	const handleAdd = useStableCallback(() => append({ ...EMPTY_PHONE }));

	const handleRemove = useStableCallback((index: number) => {
		if (fields.length > 1) {
			remove(index);
			return;
		}

		update(index, { ...EMPTY_PHONE });
	});

	return (
		<Box is='fieldset' className={className} display='flex' flexDirection='column' width='100%'>
			<legend {...visuallyHiddenProps}>{t('Phone_Numbers')}</legend>
			<Box is='ul' id={listId} display='flex' flexDirection='column' gap={16}>
				{fields.map((field, index) => (
					<PhoneNumberFieldRow key={field.id} control={phonesControl} index={index} onRemove={handleRemove} />
				))}
			</Box>
			<Box>
				<Button icon='plus' aria-controls={listId} onClick={handleAdd} marginBlockStart={16}>
					{t('Add_number')}
				</Button>
			</Box>
		</Box>
	);
};

export default PhoneNumberFieldList;
