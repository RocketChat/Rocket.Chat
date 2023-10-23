import crypto from 'crypto';

import { verify, sign, getPairs } from '@rocket.chat/jwt';

import type { ILicenseV3 } from './definition/ILicenseV3';

const PUBLIC_LICENSE_KEY_V2 =
	'-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4PZJT08Moo8nKT9eDFYfXkhuAbuhOJyXW8aqGU6iSKGrheIt0Z9FVpY4Wkf/BGUmlCCXTIZEGlixZtMWbHVBfnKgdG285lLufGME1lb7QQi8li4Ij9OcAYf1xdVeCrUrBCYxKqyycqu1AjzJSr4b6y2rWIU3oz1sfD8daDKUOLLlAyeYvlmCAcJdGkVyMr6bJnN418T0lNrl2CCrWq8lV/JsLciuo0TGBCHS2SdNjKmDjKA7MRufPcMVjb4oSmGbNBcTm68/l1SP+bnl00EnPAgD1iunlxba1KgWGXINqB2koFkbbH2VAiztX1Z7MERhEGz7BStXGBNFtpdGrhSzUQIDAQAB-----END PUBLIC KEY-----';

const PUBLIC_LICENSE_KEY_V3 = PUBLIC_LICENSE_KEY_V2;

let TEST_KEYS: [string, string] | undefined = undefined;

export async function decrypt(encrypted: string): Promise<string> {
	if (process.env.NODE_ENV === 'test') {
		if (encrypted.startsWith('RCV3_')) {
			const jwt = encrypted.substring(5);

			TEST_KEYS = TEST_KEYS ?? (await getPairs());

			if (!TEST_KEYS) {
				throw new Error('Missing PUBLIC_LICENSE_KEY_V3');
			}

			const [spki] = TEST_KEYS;

			const [payload] = await verify(jwt, spki);
			return JSON.stringify(payload);
		}
	}

	// handle V3
	if (encrypted.startsWith('RCV3_')) {
		const jwt = encrypted.substring(5);
		const [payload] = await verify(jwt, PUBLIC_LICENSE_KEY_V3);

		return JSON.stringify(payload);
	}

	const decrypted = crypto.publicDecrypt(Buffer.from(PUBLIC_LICENSE_KEY_V2, 'base64').toString('utf-8'), Buffer.from(encrypted, 'base64'));

	return decrypted.toString('utf-8');
}

export async function encrypt(license: ILicenseV3): Promise<string> {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('This function should only be used in tests');
	}

	TEST_KEYS = TEST_KEYS ?? (await getPairs());

	const [, pkcs8] = TEST_KEYS;

	return `RCV3_${await sign(license, pkcs8)}`;
}
