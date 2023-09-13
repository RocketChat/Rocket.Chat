import type { CloudVersionsResponse } from '@rocket.chat/server-cloud-communication';

import { supportedVersionsChooseLatest } from './supportedVersionsChooseLatest';

describe('supportedVersionsChooseLatest', () => {
	test('should return the latest version', async () => {
		const versionFromLicense: CloudVersionsResponse = {
			timestamp: '2021-08-31T18:00:00.000Z',
			signed: 'license',
			versions: [],
		};

		const versionFromCloud: CloudVersionsResponse = {
			timestamp: '2021-08-31T19:00:00.000Z',
			signed: 'cloud',
			versions: [],
		};

		const result = await supportedVersionsChooseLatest(versionFromLicense, versionFromCloud);

		expect(result).toBe(versionFromCloud.signed);
	});
});
