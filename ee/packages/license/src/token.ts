import crypto from 'crypto';

import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { verify, sign, getPairs } from '@rocket.chat/jwt';

const base64Decode = (key: string): string => Buffer.from(key, 'base64').toString('utf-8');

const PUBLIC_LICENSE_KEY_V2 =
	'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUFxV1Nza2Q5LzZ6Ung4a3lQY2ljcwpiMzJ3Mnd4VnV3N3lCVDk2clEvOEQreU1lQ01POXdTU3BIYS85bkZ5d293RXRpZ3B0L3dyb1BOK1ZHU3didHdQCkZYQmVxRWxCbmRHRkFsODZlNStFbGlIOEt6L2hHbkNtSk5tWHB4RUsyUkUwM1g0SXhzWVg3RERCN010eC9pcXMKY2pCL091dlNCa2ppU2xlUzdibE5JVC9kQTdLNC9DSjNvaXUwMmJMNEV4Y2xDSGVwenFOTWVQM3dVWmdweE9uZgpOT3VkOElYWUs3M3pTY3VFOEUxNTdZd3B6Q0twVmFIWDdaSmY4UXVOc09PNVcvYUlqS2wzTDYyNjkrZUlPRXJHCndPTm1hSG56Zmc5RkxwSmh6Z3BPMzhhVm43NnZENUtLakJhaldza1krNGEyZ1NRbUtOZUZxYXFPb3p5RUZNMGUKY0ZXWlZWWjNMZWg0dkVNb1lWUHlJeng5Nng4ZjIveW1QbmhJdXZRdjV3TjRmeWVwYTdFWTVVQ2NwNzF6OGtmUAo0RmNVelBBMElEV3lNaWhYUi9HNlhnUVFaNEdiL3FCQmh2cnZpSkNGemZZRGNKZ0w3RmVnRllIUDNQR0wwN1FnCnZMZXZNSytpUVpQcnhyYnh5U3FkUE9rZ3VyS2pWclhUVXI0QTlUZ2lMeUlYNVVsSnEzRS9SVjdtZk9xWm5MVGEKU0NWWEhCaHVQbG5DR1pSMDFUb1RDZktoTUcxdTBDRm5MMisxNWhDOWZxT21XdjlRa2U0M3FsSjBQZ0YzVkovWAp1eC9tVHBuazlnbmJHOUpIK21mSDM5Um9GdlROaW5Zd1NNdll6dXRWT242OXNPemR3aERsYTkwbDNBQ2g0eENWCks3Sk9YK3VIa29OdTNnMmlWeGlaVU0wQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=';
const PUBLIC_STATS_KEY_V2 =
	'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuT0IvR3lCUXg1cVJZOC83dGxhTApkd0hSOWZBWHVzQ3ZBVU9YRjFPYjExaWx4ejdqY0pqWitaRjE2UTk3bjF3UDlvQnJMUDg5M3ZXUlc1bUtDdFpDClJQNTdJU1o2YjlHOXoyNStnV0NEa3ZZUUg1djJlMGoxUnE5TnNYMktlTWViOUZXenRQVFEvdDRvUW1SdUpiTEIKV013ajRRbHZ4OStpdWpkdGdQYmx5S0VFM0I3T1RPWk8xNzNOK2RDZW8wOWlQcStyKzBiRjNGSTRVcVFiZkFrdApOdGd0OUxVbjdlalNaQXNhSTZPbVBmOVVvSzM4NUdxWUxvbk1WbXBFbmZyRDlHSHl0OXFOY2pCTmZ1MUJLZWlUClBwVit6WE1FViszLzZ2bi84OW1id28zS0ZtTnRxVTJpRk5Yak5Cb2w1ZE82N3VlM0pURXBVQmJWRHZ2V3gwTk8KWndJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==';

const PUBLIC_LICENSE_KEY_V3 = base64Decode(PUBLIC_LICENSE_KEY_V2);

let TEST_KEYS: [string, string] | undefined = undefined;

export async function decryptStatsToken(encrypted: string): Promise<string> {
	if (process.env.NODE_ENV?.toLowerCase() === 'test') {
		TEST_KEYS = TEST_KEYS ?? (await getPairs());

		if (!TEST_KEYS) {
			throw new Error('Missing PUBLIC_STATS_KEY_V3');
		}

		const [spki] = TEST_KEYS;

		const [payload] = await verify(encrypted, spki);
		return JSON.stringify(payload);
	}

	const [payload] = await verify(encrypted, base64Decode(PUBLIC_STATS_KEY_V2));

	return JSON.stringify(payload);
}

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

export async function encryptStatsToken(data: Record<string, any>): Promise<string> {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('This function should only be used in tests');
	}

	TEST_KEYS = TEST_KEYS ?? (await getPairs());

	const [, pkcs8] = TEST_KEYS;

	return sign(data, pkcs8);
}
