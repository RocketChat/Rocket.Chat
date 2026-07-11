import type { SignedSupportedVersions } from '@rocket.chat/server-cloud-communication';

import { supportedVersionsChooseLatest } from './supportedVersionsChooseLatest';

describe('supportedVersionsChooseLatest', () => {
	test('should return the latest version', async () => {
		const versionFromLicense: SignedSupportedVersions = {
			signed: 'signed____',
			timestamp: '2021-08-31T18:00:00.000Z',
			versions: [],
		};

		const versionFromCloud: SignedSupportedVersions = {
			signed: 'signed_------',
			timestamp: '2021-08-31T19:00:00.000Z',
			versions: [],
		};

		const result = await supportedVersionsChooseLatest(versionFromLicense, versionFromCloud);

		expect(result.timestamp).toBe(versionFromCloud.timestamp);
	});
});
