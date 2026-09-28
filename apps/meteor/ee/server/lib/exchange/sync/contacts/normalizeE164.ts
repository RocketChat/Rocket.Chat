import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

// libphonenumber's own marker for "no region given". An international number parses under it; a local one does not.
const UNKNOWN_REGION = 'ZZ';

/**
 * The E.164 form of `raw`, or nothing when it cannot be resolved to one.
 *
 * A number written without a country code only resolves when `defaultRegion` says which country to assume,
 * and guessing one would mint keys that match the wrong contact. So no region means no key, and the number
 * stays available for display through `raw`.
 *
 * @param defaultRegion ISO 3166-1 alpha-2, for example `DE`.
 */
export const normalizeE164 = (raw: string, defaultRegion?: string): string | undefined => {
	const value = raw.trim();
	if (!value) {
		return undefined;
	}

	try {
		const parsed = phoneUtil.parseAndKeepRawInput(value, defaultRegion?.trim().toUpperCase() || UNKNOWN_REGION);

		return phoneUtil.isValidNumber(parsed) ? phoneUtil.format(parsed, PhoneNumberFormat.E164) : undefined;
	} catch {
		return undefined;
	}
};
