import { expect } from 'chai';

import { compareSettings } from '../../../../../server/settings/SettingsRegistry';
import { getSettingDefaults } from '../../../../../server/settings/functions/getSettingDefaults';

const testSetting = getSettingDefaults({
	_id: 'my_dummy_setting',
	type: 'string',
	value: 'dummy',
});

describe('#compareSettings', () => {
	const ignoredKeys = ['value', 'ts', 'createdAt', 'valueSource', 'packageValue', 'processEnvValue', '_updatedAt'];

	ignoredKeys.forEach((key) =>
		it(`should return true if ${key} changes`, () => {
			const copiedSetting: any = { ...testSetting };

			if (['ts', 'createdAt', '_updatedAt'].includes(key)) {
				copiedSetting[key] = new Date();
			} else {
				copiedSetting[key] = 'random';
			}

			expect(compareSettings(testSetting, copiedSetting)).to.be.true;
		}),
	);
});
