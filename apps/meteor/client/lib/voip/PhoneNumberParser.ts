// TODO: This file is not yet used since we need to test more the way voip is returning unknown contatcts.

import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

const phoneNumberParser = (
	phoneNumber: string,
	// currentCountryCode: string,
): { numberRegionCode?: string; parsedNumber?: string; error?: string } => {
	const phoneNumberUtil = PhoneNumberUtil.getInstance();
	let numberRegionCode;
	let parsedNumber;
	let error;
	try {
		const number = phoneNumberUtil.parse(phoneNumber);
		numberRegionCode = phoneNumberUtil.getRegionCodeForNumber(number);
		parsedNumber = phoneNumberUtil.format(number, PhoneNumberFormat.INTERNATIONAL);
	} catch (e) {
		error = e as string | undefined;
	}

	return { numberRegionCode, parsedNumber, error };
};

export default phoneNumberParser;
