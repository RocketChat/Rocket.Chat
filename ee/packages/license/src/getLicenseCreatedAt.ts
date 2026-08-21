import type { ILicenseV3 } from '@rocket.chat/core-typings';

import { decrypt } from './token';

/**
 * Returns the signature-verified `information.createdAt` of an encrypted license,
 * without applying it.
 *
 * Returns `undefined` when the string is empty or invalid, or when the license
 * carries no issue date (V2 licenses) — callers ordering licenses by age should
 * treat those as the oldest.
 */
export async function getLicenseCreatedAt(encryptedLicense: string): Promise<Date | undefined> {
	const license = (encryptedLicense ?? '').trim();

	if (!license.startsWith('RCV3_')) {
		return undefined;
	}

	try {
		const decrypted: ILicenseV3 = JSON.parse(await decrypt(license));

		const createdAt = new Date(decrypted.information.createdAt);

		return Number.isNaN(createdAt.getTime()) ? undefined : createdAt;
	} catch {
		return undefined;
	}
}
