import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const mockLicense = {
	getLicense: sinon.stub(),
};

let disableCustomScripts: () => boolean;

before(async () => {
	const license = await import('@rocket.chat/license');
	const moduleMocks = [mock.module('@rocket.chat/license', { exports: { ...license, License: mockLicense } })];
	({ disableCustomScripts } = await import('./disableCustomScripts'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('disableCustomScripts', () => {
	let disableCustomScriptsVar: any;

	beforeEach(() => {
		disableCustomScriptsVar = process.env.DISABLE_CUSTOM_SCRIPTS;
		mockLicense.getLicense.reset();
	});

	afterEach(() => {
		process.env.DISABLE_CUSTOM_SCRIPTS = disableCustomScriptsVar;
		sinon.restore();
	});

	it('should return false when license is missing', () => {
		mockLicense.getLicense.returns(null);

		const result = disableCustomScripts();
		expect(result).to.be.false;
	});

	it('should return false when DISABLE_CUSTOM_SCRIPTS is not true', () => {
		mockLicense.getLicense.returns({
			information: {
				trial: true,
			},
		});

		const result = disableCustomScripts();
		expect(result).to.be.false;
	});

	it('should return false when license is not a trial', () => {
		mockLicense.getLicense.returns({
			information: {
				trial: false,
			},
		});

		process.env.DISABLE_CUSTOM_SCRIPTS = 'true';

		const result = disableCustomScripts();
		expect(result).to.be.false;
	});

	it('should return true when DISABLE_CUSTOM_SCRIPTS is true and license is a trial', () => {
		mockLicense.getLicense.returns({
			information: {
				trial: true,
			},
		});

		process.env.DISABLE_CUSTOM_SCRIPTS = 'true';

		const result = disableCustomScripts();
		expect(result).to.be.true;
	});
});
