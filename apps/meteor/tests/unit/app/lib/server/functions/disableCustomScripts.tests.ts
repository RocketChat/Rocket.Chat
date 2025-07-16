import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('disableCustomScripts', () => {
	let mockLicense: sinon.SinonStubbedInstance<any>;
	let disableCustomScripts: () => boolean;
	let disableCustomScriptsVar: any;

	beforeEach(() => {
		disableCustomScriptsVar = process.env.DISABLE_CUSTOM_SCRIPTS;
		mockLicense = {
			getLicense: sinon.stub(),
		};

		disableCustomScripts = proxyquire('../../../../../../app/lib/server/functions/disableCustomScripts.ts', {
			'@rocket.chat/license': { License: mockLicense },
		}).disableCustomScripts;
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
