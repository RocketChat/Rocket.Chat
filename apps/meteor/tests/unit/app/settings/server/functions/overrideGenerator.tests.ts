import { expect } from 'chai';

import { getSettingDefaults } from '../../../../../../app/settings/server/functions/getSettingDefaults';
import { overrideGenerator } from '../../../../../../app/settings/server/functions/overrideGenerator';

describe('overrideGenerator', () => {
	it('should return a new object with the new value', () => {
		const overwrite = overrideGenerator(() => 'value');

		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string' });
		const overwritten = overwrite(setting);

		expect(overwritten).to.be.an('object');
		expect(overwritten).to.have.property('_id');

		expect(setting).to.be.not.equal(overwritten);

		expect(overwritten).to.have.property('value').that.equals('value');
		expect(overwritten).to.have.property('valueSource').that.equals('processEnvValue');
	});

	it('should return the same object since the value didnt change', () => {
		const overwrite = overrideGenerator(() => 'test');

		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string' });
		const overwritten = overwrite(setting);

		expect(setting).to.be.equal(overwritten);
	});
});
