import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('validateUsername', () => {
	const getStub = sinon.stub();

	const proxySettings = {
		settings: {
			get: getStub,
		},
	};

	const { validateUsername } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/validateUsername', {
		'../../../settings/server': proxySettings,
	});

	beforeEach(() => {
		getStub.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('with default settings', () => {
		beforeEach(() => {
			getStub.withArgs('UTF8_User_Names_Validation').returns('[0-9a-zA-Z-_.]+');
		});

		it('should return true for a valid username', () => {
			const result = validateUsername('valid_username.123');
			expect(result).to.be.true;
		});

		it('should return false for an invalid username containing special HTML tags', () => {
			const result = validateUsername('username<div>$</div>');
			expect(result).to.be.false;
		});

		it('should return false for an empty username', () => {
			const result = validateUsername('');
			expect(result).to.be.false;
		});

		it('should return false for a username with invalid characters', () => {
			const result = validateUsername('invalid*username!');
			expect(result).to.be.false;
		});

		it('should return true for a username with allowed special characters', () => {
			const result = validateUsername('username-_.');
			expect(result).to.be.true;
		});
	});

	describe('with custom regex settings', () => {
		beforeEach(() => {
			getStub.withArgs('UTF8_User_Names_Validation').returns('[a-zA-Z]+');
		});

		it('should return true for a username matching the custom regex', () => {
			const result = validateUsername('ValidUsername');
			expect(result).to.be.true;
		});

		it('should return false for a username that does not match the custom regex', () => {
			const result = validateUsername('username123');
			expect(result).to.be.false;
		});
	});

	describe('with null regex settings', () => {
		beforeEach(() => {
			getStub.withArgs('UTF8_User_Names_Validation').returns(null);
		});

		it('should fallback to the default regex pattern if the settings value is null', () => {
			const result = validateUsername('username');
			expect(result).to.be.true;
		});
	});

	describe('with invalid regex settings', () => {
		beforeEach(() => {
			getStub.withArgs('UTF8_User_Names_Validation').returns('invalid[');
		});

		it('should fallback to the default regex pattern if the settings value is invalid', () => {
			const result = validateUsername('username');
			expect(result).to.be.true;
		});
	});
});
