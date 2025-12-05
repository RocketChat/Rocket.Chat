import { LDAP } from '@rocket.chat/core-services';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { Match, check } from 'meteor/check';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type ldapTestSearchProps = {
	username: string;
};

const ldapTestSearchPropsSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
	},
	required: ['username'],
	additionalProperties: false,
};

const isLdapTestSearch = ajv.compile<ldapTestSearchProps>(ldapTestSearchPropsSchema);

const ldapEndpoints = API.v1
	.get(
		'ldap.testConnection',
		{
			authRequired: true,
			permissionsRequired: ['test-admin-options'],
			response: {
				200: ajv.compile<{
					message: string;
				}>({
					type: 'object',
					properties: {
						message: {
							type: 'string',
							enum: ['LDAP_Connection_successful'],
						},
						success: {
							type: 'boolean',
							enum: [true],
							description: 'Whether the connection was successful or not',
						},
					},
					required: ['success', 'message'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user');
			}

			if (settings.get<boolean>('LDAP_Enable') !== true) {
				throw new Meteor.Error('LDAP_disabled');
			}

			try {
				await LDAP.testConnection();
			} catch (error) {
				SystemLogger.error(error);
				throw new Meteor.Error('Connection_failed');
			}

			return API.v1.success({
				message: 'LDAP_Connection_successful' as const,
			});
		},
	)
	.post(
		'ldap.testSearch',
		{
			authRequired: true,
			permissionsRequired: ['test-admin-options'],
			body: isLdapTestSearch,
			response: {
				200: ajv.compile<{
					message: string;
				}>({
					type: 'object',
					properties: {
						message: {
							type: 'string',
							enum: ['LDAP_User_Found'],
						},
						success: {
							type: 'boolean',
							enum: [true],
							description: 'Whether the connection was successful or not',
						},
					},
					required: ['success', 'message'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					username: String,
				}),
			);

			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user');
			}

			if (settings.get('LDAP_Enable') !== true) {
				throw new Meteor.Error('LDAP_disabled');
			}

			await LDAP.testSearch(this.bodyParams.username);

			return API.v1.success({
				message: 'LDAP_User_Found' as const,
			});
		},
	);

export type LdapEndpoints = ExtractRoutesFromAPI<typeof ldapEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LdapEndpoints {}
}
