import { check, Match } from 'meteor/check';
import { IUser } from '@rocket.chat/core-typings';

import { Users, Sessions } from '../../../app/models/server/raw/index';
import { API } from '../../../app/api/server/api';
import { hasLicense } from '../../app/license/server/license';

API.v1.addRoute(
	'sessions/list',
	{ authRequired: true },
	{
		async get() {
			if (!this.userId) {
				API.v1.failure('error-invalid-user');
			}
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}
			check(
				this.queryParams,
				Match.ObjectIncluding({
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
					search: Match.Maybe(String),
				}),
			);

			const { offset, count } = this.getPaginationItems();
			const search: string = this.queryParams?.search || '';

			const sessions = await Sessions.aggregateSessionsByUserId(this.userId, search, { offset, count });
			return API.v1.success(sessions);
		},
	},
);

API.v1.addRoute(
	'sessions/info',
	{ authRequired: true },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}
			check(this.queryParams, {
				sessionId: String,
			});

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
	{ authRequired: true },
	{
		async post() {
			if (!this.userId) {
				API.v1.failure('error-invalid-user');
			}

			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}
			check(this.bodyParams, {
				sessionId: String,
			});

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionIdAndUserId(sessionId, this.userId);

			if (!sessionObj?.loginToken) {
				return API.v1.notFound('Session not found');
			}

			await Users.unsetOneLoginToken(this.userId, sessionObj.loginToken);

			await Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: this.userId });
			return API.v1.success({ sessionId });
		},
	},
);

API.v1.addRoute(
	'sessions/list.all',
	{ authRequired: true, twoFactorRequired: true, permissionsRequired: ['view-device-management'] },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}
			check(
				this.queryParams,
				Match.ObjectIncluding({
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
					search: Match.Maybe(String),
				}),
			);

			const { offset, count } = this.getPaginationItems();
			let search: string = this.queryParams?.search || '';

			const searchUser = await Users.find<Pick<IUser, '_id'>>(
				{ $text: { $search: search }, active: true },
				{
					projection: { _id: 1, score: { $meta: 'textScore' } },
					limit: 5,
					sort: { score: { $meta: 'textScore' } },
				},
			).toArray();

			if (searchUser?.length) {
				search += ` ${searchUser.map((user) => user._id).join(' ')}`;
			}

			const sessions = await Sessions.aggregateSessionsAndPopulate(search, { offset, count });
			return API.v1.success(sessions);
		},
	},
);

API.v1.addRoute(
	'sessions/info.admin',
	{ authRequired: true, twoFactorRequired: true, permissionsRequired: ['view-device-management'] },
	{
		async get() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}
			check(this.queryParams, {
				sessionId: String,
			});

			const { sessionId } = this.queryParams;
			const { sessions } = await Sessions.aggregateSessionsAndPopulate(sessionId, { offset: 0, count: 1 });
			if (!sessions?.length) {
				return API.v1.notFound('Session not found');
			}
			return API.v1.success(sessions[0]);
		},
	},
);

API.v1.addRoute(
	'sessions/logout',
	{ authRequired: true, twoFactorRequired: true, permissionsRequired: ['logout-device-management'] },
	{
		async post() {
			if (!hasLicense('device-management')) {
				return API.v1.unauthorized();
			}

			check(this.bodyParams, {
				sessionId: String,
			});

			const { sessionId } = this.bodyParams;
			const sessionObj = await Sessions.findOneBySessionId(sessionId);

			if (!sessionObj) {
				return API.v1.notFound('Session not found');
			}

			await Users.unsetOneLoginToken(sessionObj.userId, sessionObj.loginToken);

			await Sessions.logoutByloginTokenAndUserId({ loginToken: sessionObj.loginToken, userId: sessionObj.userId });
			return API.v1.success({ sessionId });
		},
	},
);
