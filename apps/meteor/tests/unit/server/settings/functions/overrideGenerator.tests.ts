import { expect } from 'chai';

import { getSettingDefaults } from '../../../../../server/settings/functions/getSettingDefaults';
import { overrideGenerator } from '../../../../../server/settings/functions/overrideGenerator';

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

	it('should stamp the env source even when the value didnt change', () => {
		const overwrite = overrideGenerator(() => 'test');

		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string' });
		const overwritten = overwrite(setting);

		expect(setting).to.be.not.equal(overwritten);
		expect(overwritten).to.have.property('value').that.equals('test');
		expect(overwritten).to.have.property('valueSource').that.equals('processEnvValue');
		expect(overwritten).to.have.property('processEnvValue').that.equals('test');
	});

	it('should return the same object when the value and the env stamp are already in place', () => {
		const overwrite = overrideGenerator(() => 'test');

		const setting = {
			...getSettingDefaults({ _id: 'test', value: 'test', type: 'string' }),
			valueSource: 'processEnvValue' as const,
			processEnvValue: 'test',
		};
		const overwritten = overwrite(setting);

		expect(setting).to.be.equal(overwritten);
	});
});
