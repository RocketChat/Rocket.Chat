import ejson from 'ejson';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { API } from '../api';
import type { PartialThis } from '../definition';
import { clean } from '../lib/cleanQuery';
import { isValidQuery } from '../lib/isValidQuery';

const pathAllowConf = {
	'/api/v1/users.list': ['$or', '$regex', '$and'],
	'def': ['$or', '$and', '$regex'],
};

export async function parseJsonQuery(api: PartialThis): Promise<{
	sort: Record<string, 1 | -1>;
	fields: Record<string, 0 | 1>;
	query: Record<string, unknown>;
}> {
	const {
		request: { route },
		userId,
		queryParams: params,
		logger,
		queryFields,
		queryOperations,
		response,
	} = api;

	let sort;
	if (params.sort) {
		try {
			sort = JSON.parse(params.sort);
			Object.entries(sort).forEach(([key, value]) => {
				if (value !== 1 && value !== -1) {
					throw new Meteor.Error('error-invalid-sort-parameter', `Invalid sort parameter: ${key}`, {
						helperMethod: 'parseJsonQuery',
					});
				}
			});
		} catch (e) {
			logger.warn(`Invalid sort parameter provided "${params.sort}":`, e);
			throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${params.sort}"`, {
				helperMethod: 'parseJsonQuery',
			});
		}
	}

	let fields: Record<string, 0 | 1> | undefined;
	if (params.fields) {
		apiDeprecationLogger.parameter(route, 'fields', '7.0.0', response);
		try {
			fields = JSON.parse(params.fields) as Record<string, 0 | 1>;

			Object.entries(fields).forEach(([key, value]) => {
				if (value !== 1 && value !== 0) {
					throw new Meteor.Error('error-invalid-sort-parameter', `Invalid fields parameter: ${key}`, {
						helperMethod: 'parseJsonQuery',
					});
				}
			});
		} catch (e) {
			logger.warn(`Invalid fields parameter provided "${params.fields}":`, e);
			throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${params.fields}"`, {
				helperMethod: 'parseJsonQuery',
			});
		}
	}

	// Verify the user's selected fields only contains ones which their role allows
	if (typeof fields === 'object') {
		let nonSelectableFields = Object.keys(API.v1.defaultFieldsToExclude);
		if (route.includes('/v1/users.')) {
			nonSelectableFields = nonSelectableFields.concat(
				Object.keys(
					(await hasPermissionAsync(userId, 'view-full-other-user-info'))
						? API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser
						: API.v1.limitedUserFieldsToExclude,
				),
			);
		}

		Object.keys(fields).forEach((k) => {
			if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(API.v1.fieldSeparator)[0])) {
				fields && delete fields[k as keyof typeof fields];
			}
		});
	}

	// Limit the fields by default
	fields = Object.assign({}, fields, API.v1.defaultFieldsToExclude);
	if (route.includes('/v1/users.')) {
		if (await hasPermissionAsync(userId, 'view-full-other-user-info')) {
			fields = Object.assign(fields, API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser);
		} else {
			fields = Object.assign(fields, API.v1.limitedUserFieldsToExclude);
		}
	}

	let query: Record<string, any> = {};
	if (params.query) {
		apiDeprecationLogger.parameter(route, 'query', '7.0.0', response);

		try {
			query = ejson.parse(params.query);
			query = clean(query, pathAllowConf.def);
		} catch (e) {
			logger.warn(`Invalid query parameter provided "${params.query}":`, e);
			throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${params.query}"`, {
				helperMethod: 'parseJsonQuery',
			});
		}
	}

	// Verify the user has permission to query the fields they are
	if (typeof query === 'object') {
		let nonQueryableFields = Object.keys(API.v1.defaultFieldsToExclude);

		if (route.includes('/v1/users.')) {
			if (await hasPermissionAsync(userId, 'view-full-other-user-info')) {
				nonQueryableFields = nonQueryableFields.concat(Object.keys(API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser));
			} else {
				nonQueryableFields = nonQueryableFields.concat(Object.keys(API.v1.limitedUserFieldsToExclude));
			}
		}

		if (queryFields && !isValidQuery(query, queryFields || ['*'], queryOperations ?? pathAllowConf.def)) {
			throw new Meteor.Error('error-invalid-query', isValidQuery.errors.join('\n'));
		}

		Object.keys(query).forEach((k) => {
			if (nonQueryableFields.includes(k) || nonQueryableFields.includes(k.split(API.v1.fieldSeparator)[0])) {
				query && delete query[k];
			}
		});
	}

	return {
		sort,
		fields,
		query,
	};
}
