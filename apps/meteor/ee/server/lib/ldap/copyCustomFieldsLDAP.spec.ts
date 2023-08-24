import type { IImportUser, ILDAPEntry } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { expect, spy } from 'chai';

import { copyCustomFieldsLDAP } from './copyCustomFieldsLDAP';

describe('LDAP copyCustomFieldsLDAP', () => {
	it('should copy custom fields from ldapUser to rcUser', () => {
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: true,
				customFieldsSettings: JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				}),
				customFieldsMap: JSON.stringify({
					givenName: 'mappedGivenName',
				}),
			},
			{
				debug: () => undefined,
				error: () => undefined,
			} as unknown as Logger,
		);

		expect(userData).to.have.property('customFields');
		expect(userData.customFields).to.be.eql({ mappedGivenName: 'Test' });
	});

	it('should copy custom fields from ldapUser to rcUser already having other custom fields', () => {
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
			customFields: {
				custom: 'Test',
			},
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: true,
				customFieldsSettings: JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				}),
				customFieldsMap: JSON.stringify({
					givenName: 'mappedGivenName',
				}),
			},
			{
				debug: () => undefined,
				error: () => undefined,
			} as unknown as Logger,
		);

		expect(userData).to.have.property('customFields');
		expect(userData.customFields).to.be.eql({ custom: 'Test', mappedGivenName: 'Test' });
	});

	it('should not copy custom fields from ldapUser to rcUser if syncCustomFields is false', () => {
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: false,
				customFieldsSettings: JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				}),
				customFieldsMap: JSON.stringify({
					givenName: 'mappedGivenName',
				}),
			},
			{
				debug: () => undefined,
				error: () => undefined,
			} as unknown as Logger,
		);

		expect(userData).to.not.have.property('customFields');
	});

	it('should call logger.error if customFieldsSettings is not a valid JSON', () => {
		const debug = spy();
		const error = spy();
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: true,
				customFieldsSettings: `${JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				})}}`,
				customFieldsMap: JSON.stringify({
					givenName: 'mappedGivenName',
				}),
			},
			{
				debug,
				error,
			} as unknown as Logger,
		);
		expect(error).to.have.been.called.exactly(1);
	});
	it('should call logger.error if customFieldsMap is not a valid JSON', () => {
		const debug = spy();
		const error = spy();
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: true,
				customFieldsSettings: JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				}),
				customFieldsMap: `${JSON.stringify({
					givenName: 'mappedGivenName',
				})}}`,
			},
			{
				debug,
				error,
			} as unknown as Logger,
		);
		expect(error).to.have.been.called.exactly(1);
	});

	it('should call logger.debug if some custom fields are not mapped but still mapping the other fields', () => {
		const debug = spy();
		const error = spy();
		const ldapUser = {
			mail: 'test@test.com',
			givenName: 'Test',
		} as unknown as ILDAPEntry;

		const userData = {
			name: 'Test',
			username: 'test',
		} as unknown as IImportUser;

		copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				syncCustomFields: true,
				customFieldsSettings: JSON.stringify({
					mappedGivenName: { type: 'text', required: false },
				}),
				customFieldsMap: JSON.stringify({
					givenName: 'mappedGivenName',
					test: 'test',
				}),
			},
			{
				debug,
				error,
			} as unknown as Logger,
		);
		expect(debug).to.have.been.called.exactly(1);
		expect(userData).to.have.property('customFields');
		expect(userData.customFields).to.be.eql({ mappedGivenName: 'Test' });
	});
});
