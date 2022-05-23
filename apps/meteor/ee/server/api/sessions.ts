import { Meteor } from 'meteor/meteor';
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

			const sessions = await Sessions.getByUserId(this.userId, search, { offset, count });
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
			const sessionObj = await Sessions.findOneBySessionIdAndUserID(sessionId, this.userId);

			if (!sessionObj) {
				return API.v1.notFound('Session not found');
			}

			Meteor.users.update(this.userId, {
				$pull: {
					'services.resume.loginTokens': {
						hashedToken: sessionObj.loginToken,
					},
				},
			});

			await Sessions.updateMany({ loginToken: sessionObj.loginToken }, { $set: { logoutAt: new Date(), logoutBy: this.userId } });
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
				{ projection: { _id: 1 }, limit: 10 },
			).toArray();
			if (searchUser?.length) {
				search += ` ${searchUser.map((user) => user._id).join(' ')}`;
			}

			const sessions = await Sessions.getAllSessions(search, { offset, count });
			return API.v1.success(sessions);
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

			Meteor.users.update(sessionObj.userId, {
				$pull: {
					'services.resume.loginTokens': {
						hashedToken: sessionObj.loginToken,
					},
				},
			});

			await Sessions.updateMany({ loginToken: sessionObj.loginToken }, { $set: { logoutAt: new Date(), logoutBy: this.userId } });
			return API.v1.success({ sessionId });
		},
	},
);
