import { expect } from 'chai';

import { compareSettingsMetadata } from '../../../../../../app/settings/server/SettingsRegistry';
import { getSettingDefaults } from '../../../../../../app/settings/server/functions/getSettingDefaults';

const testSetting = getSettingDefaults({
	_id: 'my_dummy_setting',
	type: 'string',
	value: 'dummy',
});

describe('#compareSettingsMetadata', () => {
	const ignoredKeys = ['value', 'ts', 'createdAt', 'valueSource', 'packageValue', 'processEnvValue', '_updatedAt'];

	ignoredKeys.forEach((key) =>
		it(`should return true if ${key} changes`, () => {
			const copiedSetting: any = { ...testSetting };

			if (['ts', 'createdAt', '_updatedAt'].includes(key)) {
				copiedSetting[key] = new Date();
			} else {
				copiedSetting[key] = 'random';
			}

			expect(compareSettingsMetadata(testSetting, copiedSetting)).to.be.true;
		}),
	);
});
