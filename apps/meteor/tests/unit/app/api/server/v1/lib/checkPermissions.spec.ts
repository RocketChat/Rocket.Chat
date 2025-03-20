import { expect } from 'chai';
import { describe, it } from 'mocha';
import mock from 'proxyquire';
import Sinon from 'sinon';

import type { PermissionsPayload } from '../../../../../../../app/api/server/api.helpers';

const mocks = {
	'../../lib/server/lib/deprecationWarningLogger': {
		apiDeprecationLogger: {
			endpoint: Sinon.stub(),
		},
	},
};
const { checkPermissions } = mock.noCallThru().load('../../../../../../../app/api/server/api.helpers', mocks);

describe('checkPermissions', () => {
	it('should return false when no options.permissionsRequired key is present', () => {
		const options = {};
		expect(checkPermissions(options)).to.be.false;
	});
	it('should return false when options.permissionsRequired is of an invalid format', () => {
		const options = {
			permissionsRequired: 'invalid',
		};
		expect(checkPermissions(options)).to.be.false;
	});
	it('should return true and modify options.permissionsRequired when permissionsRequired key is an array (of permissions)', () => {
		const options = {
			permissionsRequired: ['invalid', 'invalid2'],
		};
		expect(checkPermissions(options)).to.be.true;
		expect(options.permissionsRequired).to.be.an('object');
		expect(options.permissionsRequired).to.have.property('*');
		// @ts-expect-error -for test purposes :)
		expect(options.permissionsRequired['*']).to.be.an('object');
		// @ts-expect-error -for test purposes :)
		expect(options.permissionsRequired['*'].permissions).to.be.an('array').that.includes('invalid');
	});
	it('should return true and modify options.permissionsRequired when permissionsRequired key is an object (of permissions)', () => {
		const options = {
			permissionsRequired: {
				GET: ['invalid', 'invalid2'],
			},
		};
		expect(checkPermissions(options)).to.be.true;
		expect(options.permissionsRequired).to.be.an('object');
		expect(options.permissionsRequired).to.have.property('GET');
		expect(options.permissionsRequired.GET).to.be.an('object');
		expect(options.permissionsRequired.GET).to.have.property('operation', 'hasAll');
		expect(options.permissionsRequired.GET).to.have.property('permissions').that.is.an('array').that.includes('invalid');
	});
	it('should return true and not modify options.permissionsRequired when its of new format', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};
		expect(checkPermissions(options)).to.be.true;
		expect(options.permissionsRequired).to.be.an('object');
		expect(options.permissionsRequired).to.have.property('GET');
		expect(options.permissionsRequired.GET).to.be.an('object');
		expect(options.permissionsRequired.GET).to.have.property('operation', 'hasAll');
		expect(options.permissionsRequired.GET).to.have.property('permissions').that.is.an('array').that.includes('invalid');
	});

	it('should persist the right operation for method', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAny',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};
		expect(checkPermissions(options)).to.be.true;
		expect(options.permissionsRequired).to.be.an('object');
		expect(options.permissionsRequired).to.have.property('GET');
		expect(options.permissionsRequired.GET).to.be.an('object');
		expect(options.permissionsRequired.GET).to.have.property('operation', 'hasAny');
		expect(options.permissionsRequired.GET).to.have.property('permissions').that.is.an('array').that.includes('invalid');
	});
	it('should persist the right method keys', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
				POST: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};
		expect(checkPermissions(options)).to.be.true;
		expect(options.permissionsRequired).to.be.an('object');
		expect(options.permissionsRequired).to.have.property('GET');
		expect(options.permissionsRequired).to.have.property('POST');
		expect(options.permissionsRequired.GET).to.be.an('object');
		expect(options.permissionsRequired.GET).to.have.property('operation', 'hasAll');
		expect(options.permissionsRequired.GET).to.have.property('permissions').that.is.an('array').that.includes('invalid');
	});
});
