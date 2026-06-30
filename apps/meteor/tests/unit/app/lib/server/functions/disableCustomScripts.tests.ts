import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

const { sandbox, mockLicense } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		mockLicense: {
			getLicense: sandbox.stub(),
		},
	};
});

vi.mock('@rocket.chat/license', () => ({ License: mockLicense }));

const { disableCustomScripts } = await import('../../../../../../app/lib/server/functions/disableCustomScripts');

describe('disableCustomScripts', () => {
	let disableCustomScriptsVar: any;

	beforeEach(() => {
		disableCustomScriptsVar = process.env.DISABLE_CUSTOM_SCRIPTS;
		sandbox.reset();
	});

	afterEach(() => {
		process.env.DISABLE_CUSTOM_SCRIPTS = disableCustomScriptsVar;
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
