import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Formats a phone number string to international format using Google's libphonenumber.
 *
 * @param {string} rawNumber - The raw phone number string to format
 * @param {string} [defaultRegion='US'] - The default region (country code) to use for parsing
 * @returns {string} The formatted phone number in international format if valid, or the original input if invalid
 *
 * @example
 * // Returns "+1 555-123-4567"
 * formatPhoneNumber("5551234567");
 *
 * @example
 * // Returns "+44 20 7123 4567"
 * formatPhoneNumber("2071234567", "GB");
 *
 * @example
 * // Returns "invalid-number" (original input)
 * formatPhoneNumber("invalid-number");
 */
export function formatPhoneNumber(rawNumber: string, defaultRegion = 'US') {
	try {
		const parsedNumber = phoneUtil.parseAndKeepRawInput(rawNumber, defaultRegion);

		if (phoneUtil.isValidNumber(parsedNumber)) {
			return phoneUtil.format(parsedNumber, PhoneNumberFormat.INTERNATIONAL);
		}

		return rawNumber;
	} catch {
		return rawNumber;
	}
}
