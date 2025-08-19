import { api } from '@rocket.chat/core-services';
import type { IUser, ISession, DeviceManagementSession, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Users, Sessions } from '@rocket.chat/models';
import type { PaginatedResult, PaginatedRequest } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import Ajv from 'ajv';

import { API } from '../../../app/api/server/api';
import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';

const ajv = new Ajv({ coerceTypes: true });

type SessionsProps = {
	sessionId: string;
};

const isSessionsProps = ajv.compile<SessionsProps>({
	type: 'object',
	properties: {
		sessionId: {
			type: 'string',
		},
	},
	required: ['sessionId'],
	additionalProperties: false,
});

type SessionsPaginateProps = PaginatedRequest<{
	filter?: string;
}>;

const isSessionsPaginateProps = ajv.compile<SessionsPaginateProps>({
	type: 'object',
	properties: {
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		filter: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
});

const validateSortKeys = (sortKeys: string[]): boolean => {
	const validSortKeys = ['loginAt', 'device.name', 'device.os.name', 'device.os.version', '_user.name', '_user.username'];

	return sortKeys.every((s) => validSortKeys.includes(s));
};

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/sessions/list': {
			GET: (params: SessionsPaginateProps) => PaginatedResult<{ sessions: Array<DeviceManagementSession> }>;
		};
		'/v1/sessions/info': {
			GET: (params: SessionsProps) => DeviceManagementSession;
		};
		'/v1/sessions/logout.me': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
		'/v1/sessions/list.all': {
			GET: (params: SessionsPaginateProps) => PaginatedResult<{ sessions: Array<DeviceManagementPopulatedSession> }>;
		};
		'/v1/sessions/info.admin': {
			GET: (params: SessionsProps) => DeviceManagementPopulatedSession;
		};
		'/v1/sessions/logout': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
	}
}

API.v1.addRoute(
	'sessions/list',
	{ authRequired: true, validateParams: isSessionsPaginateProps, license: ['device-management'] },
	{
		async get() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort = { loginAt: -1 } } = await this.parseJsonQuery();
			const search = escapeRegExp(this.queryParams?.filter || '');

			if (!validateSortKeys(Object.keys(sort))) {
				return API.v1.failure('error-invalid-sort-keys');
			}

			const sessions = await Sessions.aggregateSessionsByUserId({ uid: this.userId, search, sort, offset, count });
			return API.v1.success(sessions);
		},
	},
);

API.v1.addRoute(
	'sessions/info',
	{ authRequired: true, validateParams: isSessionsProps, license: ['device-management'] },
	{
		async get() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const { sessionId } = this.queryParams;
			const sessions = await Sessions.findOneBySessionIdAndUserId(sessionId, this.userId);
			if (!sessions) {
				return API.v1.notFound('Session not found');
			}
			return API.v1.success(sessions);
		},
	},
);

API.v1.addRoute(
	'sessions/logout.me',
	{ authRequired: true, validateParams: isSessionsProps, license: ['device-management'] },
	{
		async post() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionIdAndUserId(sessionId, this.userId);

			if (!sessionObj?.loginToken) {
				return API.v1.notFound('Session not found');
			}

			await Promise.all([
				Users.unsetOneLoginToken(this.userId, sessionObj.loginToken),
				Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: this.userId }),
			]);

			return API.v1.success({ sessionId });
		},
	},
);

API.v1.addRoute(
	'sessions/list.all',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isSessionsPaginateProps,
		permissionsRequired: ['view-device-management'],
		license: ['device-management'],
	},
	{
		async get() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort = { loginAt: -1 } } = await this.parseJsonQuery();
			const filter = escapeRegExp(this.queryParams?.filter || '');

			if (!validateSortKeys(Object.keys(sort))) {
				return API.v1.failure('error-invalid-sort-keys');
			}

			const search: string[] = [];

			if (filter) {
				search.push(filter);

				search.push(
					...(await Users.findActiveByUsernameOrNameRegexWithExceptionsAndConditions<Pick<IUser, '_id'>>(
						{ $regex: filter, $options: 'i' },
						[],
						{},
						{ projection: { _id: 1 }, limit: 5 },
					)
						.map((el) => el._id)
						.toArray()),
				);
			}

			const sessions = await Sessions.aggregateSessionsAndPopulate({ search: search.join('|'), sort, offset, count });
			return API.v1.success(sessions);
		},
	},
);

API.v1.addRoute(
	'sessions/info.admin',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isSessionsProps,
		permissionsRequired: ['view-device-management'],
		license: ['device-management'],
	},
	{
		async get() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const sessionId = this.queryParams?.sessionId as string;
			const { sessions } = await Sessions.aggregateSessionsAndPopulate({ search: sessionId, count: 1 });
			if (!sessions?.length) {
				return API.v1.notFound('Session not found');
			}
			return API.v1.success(sessions[0]);
		},
	},
);

API.v1.addRoute(
	'sessions/logout',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isSessionsProps,
		permissionsRequired: ['logout-device-management'],
		license: ['device-management'],
	},
	{
		async post() {
			if (!License.hasModule('device-management')) {
				return API.v1.forbidden();
			}

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionId(sessionId);

			if (!sessionObj?.loginToken) {
				return API.v1.notFound('Session not found');
			}

			await api.broadcast('user.forceLogout', sessionObj.userId);

			await Promise.all([
				Users.unsetOneLoginToken(sessionObj.userId, sessionObj.loginToken),
				Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: sessionObj.userId, logoutBy: this.userId }),
			]);

			return API.v1.success({ sessionId });
		},
	},
);
