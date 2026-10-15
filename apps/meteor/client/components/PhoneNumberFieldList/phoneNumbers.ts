import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import type { TFunction } from 'i18next';

import { E164_PHONE_REGEX } from './e164PhoneRegex';

export const MAX_PHONE_NUMBER_LABEL_LENGTH = 50;

export const EMPTY_PHONE: Required<IUserPhoneNumber> = { number: '', label: '' };

export type PhoneNumbersFormValues = { phones: IUserPhoneNumber[] };

export const getInitialPhones = (phones?: IUserPhoneNumber[]): Required<IUserPhoneNumber>[] =>
	phones?.length ? phones.map(({ number, label }) => ({ number, label: label ?? '' })) : [{ ...EMPTY_PHONE }];

export const getPersistedPhones = (phones: IUserPhoneNumber[] = []): IUserPhoneNumber[] =>
	phones.filter(({ number }) => number.trim() !== '');

export const isBlankPhone = ({ number, label }: IUserPhoneNumber): boolean => !number.trim() && !label?.trim();

// A fully blank row means "no phone" and is valid; any other row needs a valid number.
export const validatePhoneNumber = (phone: IUserPhoneNumber | undefined, index: number, t: TFunction): true | string => {
	if (!phone || isBlankPhone(phone)) {
		return true;
	}

	const field = `${t('Phone_number')} ${index + 1}`;

	if (!phone.number.trim()) {
		return t('Required_field', { field });
	}

	return E164_PHONE_REGEX.test(phone.number) || t('__field__is_invalid', { field });
};
