import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneNumberParser = (
	phoneNumber: string,
	currentCountryCode: string,
): { numberRegionCode?: string; parsedNumber?: string; error?: string } => {
	const phoneNumberUtil = PhoneNumberUtil.getInstance();
	let numberRegionCode;
	let parsedNumber;
	let error;
	try {
		const number = phoneNumberUtil.parse(phoneNumber);
		numberRegionCode = phoneNumberUtil.getRegionCodeForNumber(number);
		parsedNumber = phoneNumberUtil.formatOutOfCountryCallingNumber(number, currentCountryCode);
	} catch (e) {
		error = e as string | undefined;
	}

	return { numberRegionCode, parsedNumber, error };
};

export default phoneNumberParser;
