import { Users, Sessions } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { isSessionsPaginateProps, isSessionsProps } from '../../definition/rest/v1/sessions';
import { API } from '../../../app/api/server/api';
import { hasLicense } from '../../app/license/server/license';
import { Notifications } from '../../../app/notifications/server';

const validateSortKeys = (sortKeys: string[]): boolean => {
	const validSortKeys = ['loginAt', 'device.name', 'device.os.name', 'device.os.version', '_user.name', '_user.username'];

	return sortKeys.every((s) => validSortKeys.includes(s));
};

API.v1.addRoute(
	'sessions/list',
	{ authRequired: true, validateParams: isSessionsPaginateProps },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort = { loginAt: -1 } } = this.parseJsonQuery();
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
	{ authRequired: true, validateParams: isSessionsProps },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
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
	{ authRequired: true, validateParams: isSessionsProps },
	{
		async post() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionIdAndUserId(sessionId, this.userId);

			if (!sessionObj?.loginToken) {
				return API.v1.notFound('Session not found');
			}

			Promise.all([
				Users.unsetOneLoginToken(this.userId, sessionObj.loginToken),
				Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: this.userId }),
			]);

			return API.v1.success({ sessionId });
		},
	},
);

API.v1.addRoute(
	'sessions/list.all',
	{ authRequired: true, twoFactorRequired: true, validateParams: isSessionsPaginateProps, permissionsRequired: ['view-device-management'] },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort = { loginAt: -1 } } = this.parseJsonQuery();
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
	{ authRequired: true, twoFactorRequired: true, validateParams: isSessionsProps, permissionsRequired: ['view-device-management'] },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
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
	{ authRequired: true, twoFactorRequired: true, validateParams: isSessionsProps, permissionsRequired: ['logout-device-management'] },
	{
		async post() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionId(sessionId);

			if (!sessionObj?.loginToken) {
				return API.v1.notFound('Session not found');
			}

			Notifications.notifyUser(sessionObj.userId, 'force_logout');

			Promise.all([
				Users.unsetOneLoginToken(sessionObj.userId, sessionObj.loginToken),
				Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: sessionObj.userId, logoutBy: this.userId }),
			]);

			return API.v1.success({ sessionId });
		},
	},
);
