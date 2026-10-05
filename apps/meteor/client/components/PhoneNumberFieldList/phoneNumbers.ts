import type { IUserPhoneNumber } from '@rocket.chat/core-typings';

export const EMPTY_PHONE: Required<IUserPhoneNumber> = { number: '', label: '' };

export const getInitialPhones = (phones?: IUserPhoneNumber[]): IUserPhoneNumber[] => (phones?.length ? phones : [{ ...EMPTY_PHONE }]);

export const getPersistedPhones = (phones: IUserPhoneNumber[] = []): IUserPhoneNumber[] =>
	phones.filter(({ number }) => number.trim() !== '');
