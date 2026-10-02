import { expect } from 'chai';
import sinon from 'sinon';

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

	it('should convert timespan values to numbers', () => {
		const overwrite = overrideGenerator(() => '31536000000');

		const setting = getSettingDefaults({ _id: 'RetentionPolicy_TTL_Channels', value: 2592000000, type: 'timespan' });
		const overwritten = overwrite(setting);

		expect(overwritten).to.have.property('value').that.equals(31536000000);
		expect(overwritten).to.have.property('processEnvValue').that.equals(31536000000);
	});

	it('should return the same object when the timespan value already matches the env stamp', () => {
		const overwrite = overrideGenerator(() => '31536000000');

		const setting = {
			...getSettingDefaults({ _id: 'RetentionPolicy_TTL_Channels', value: 31536000000, type: 'timespan' }),
			valueSource: 'processEnvValue' as const,
			processEnvValue: 31536000000,
		};
		const overwritten = overwrite(setting);

		expect(setting).to.be.equal(overwritten);
	});

	describe('malformed numeric overrides', () => {
		let consoleError: sinon.SinonStub;

		beforeEach(() => {
			consoleError = sinon.stub(console, 'error');
		});

		afterEach(() => {
			consoleError.restore();
		});

		['30d', '30 days', 'abc', '', '1.5', '10px', 'NaN'].forEach((overwriteValue) => {
			it(`should keep the default when the timespan override is '${overwriteValue}'`, () => {
				const overwrite = overrideGenerator(() => overwriteValue);

				const setting = getSettingDefaults({ _id: 'RetentionPolicy_TTL_Channels', value: 2592000000, type: 'timespan' });
				const overwritten = overwrite(setting);

				expect(setting).to.be.equal(overwritten);
				expect(overwritten).to.have.property('value').that.equals(2592000000);
				expect(overwritten).to.have.property('valueSource').that.equals('packageValue');
				expect(overwritten).to.not.have.property('processEnvValue');
				expect(consoleError.calledOnceWith('Error converting value for setting RetentionPolicy_TTL_Channels expected "timespan" type')).to
					.be.true;
			});
		});

		['abc', '10px', '1.5'].forEach((overwriteValue) => {
			it(`should keep the default when the int override is '${overwriteValue}'`, () => {
				const overwrite = overrideGenerator(() => overwriteValue);

				const setting = getSettingDefaults({ _id: 'Message_MaxAllowedSize', value: 5000, type: 'int' });
				const overwritten = overwrite(setting);

				expect(setting).to.be.equal(overwritten);
				expect(overwritten).to.have.property('value').that.equals(5000);
			});
		});
	});
});
