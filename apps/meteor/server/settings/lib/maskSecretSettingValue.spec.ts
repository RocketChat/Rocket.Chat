import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isSecretSetting, maskSecretSettingValue, shouldSkipSecretWrite } from './maskSecretSettingValue';

describe('maskSecretSettingValue', () => {
	it('masks a secret setting with a value', () => {
		const result = maskSecretSettingValue({ secret: true, type: 'string', value: 'supersecret' });
		expect(result.value).to.equal('');
		expect(result.hasValue).to.equal(true);
	});

	it('masks a secret setting with no value', () => {
		const result = maskSecretSettingValue({ secret: true, type: 'string', value: '' });
		expect(result.value).to.equal('');
		expect(result.hasValue).to.equal(false);
	});

	it('masks a password-type setting regardless of secret flag', () => {
		const result = maskSecretSettingValue({ type: 'password', value: 'p@ssw0rd' });
		expect(result.value).to.equal('');
		expect(result.hasValue).to.equal(true);
	});

	it('does not mask a non-secret, non-password setting', () => {
		const original = { type: 'string', value: 'visible' };
		const result = maskSecretSettingValue(original);
		expect(result.value).to.equal('visible');
		expect(result.hasValue).to.be.undefined;
	});

	it('suppresses processEnvValue, meteorSettingsValue, and valueSource', () => {
		const result = maskSecretSettingValue({
			secret: true,
			type: 'string',
			value: 'secret',
			processEnvValue: 'from-env',
			meteorSettingsValue: 'from-meteor',
			valueSource: 'processEnvValue',
		});
		expect(result.processEnvValue).to.be.undefined;
		expect(result.meteorSettingsValue).to.be.undefined;
		expect(result.valueSource).to.be.undefined;
	});

	it('preserves all other fields on a masked setting', () => {
		const result = maskSecretSettingValue({
			_id: 'SMTP_Password',
			secret: true,
			type: 'password',
			value: 'secret',
			label: 'SMTP Password',
		} as any);
		expect((result as any)._id).to.equal('SMTP_Password');
		expect((result as any).label).to.equal('SMTP Password');
	});

	it('preserves all fields on a non-masked setting', () => {
		const original = { type: 'string', value: 'hello', extra: 123 } as any;
		const result = maskSecretSettingValue(original);
		expect(result).to.deep.equal(original);
	});
});

describe('isSecretSetting', () => {
	it('returns true for secret: true', () => {
		expect(isSecretSetting({ secret: true, type: 'string' })).to.equal(true);
	});

	it('returns true for type password', () => {
		expect(isSecretSetting({ type: 'password' })).to.equal(true);
	});

	it('returns false for a regular setting', () => {
		expect(isSecretSetting({ type: 'string' })).to.equal(false);
	});
});

describe('shouldSkipSecretWrite', () => {
	it('returns true when submitting empty string to a secret setting with a value', () => {
		expect(shouldSkipSecretWrite({ secret: true, type: 'string', value: 'existing' }, '')).to.equal(true);
	});

	it('returns true when submitting empty string to a password setting with a value', () => {
		expect(shouldSkipSecretWrite({ type: 'password', value: 'existing' }, '')).to.equal(true);
	});

	it('returns false when the setting has no existing value', () => {
		expect(shouldSkipSecretWrite({ type: 'password', value: '' }, '')).to.equal(false);
	});

	it('returns false when submitting a non-empty value', () => {
		expect(shouldSkipSecretWrite({ type: 'password', value: 'old' }, 'new-password')).to.equal(false);
	});

	it('returns false for a non-secret setting', () => {
		expect(shouldSkipSecretWrite({ type: 'string', value: 'existing' }, '')).to.equal(false);
	});
});
