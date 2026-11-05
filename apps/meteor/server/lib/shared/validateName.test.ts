import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { validateName } = proxyquire.noCallThru().load<typeof import('./validateName')>('./validateName', {
	'../../settings': {
		settings: {
			get: () => 'admin,administrator,system,user',
		},
	},
});

describe('validateName', () => {
	it('should accept a regular name', () => {
		expect(validateName('general')).to.be.true;
	});

	it('should accept names that contain dots', () => {
		expect(validateName('team.dev')).to.be.true;
		expect(validateName('...')).to.be.true;
	});

	it('should reject blocked names', () => {
		expect(validateName('Admin')).to.be.false;
	});

	it('should reject names that a url path cannot hold', () => {
		expect(validateName('.')).to.be.false;
		expect(validateName('..')).to.be.false;
	});
});
