import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { hasRole } from '../../../authorization/server';
import { Users, Sessions } from '../../../models/server/raw/index';
import { API } from '../api';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';

API.v1.addRoute(
	'sessions/list',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
					search: Match.Maybe(String),
				}),
			);

			try {
				const { offset, count } = this.getPaginationItems();
				const { search } = this.queryParams;

				const sessions = await Sessions.getByUserId(this.userId, search, { offset, count });
				return API.v1.success(sessions);
			} catch (error) {
				return API.v1.failure(error);
			}
		},
	},
);

API.v1.addRoute(
	'sessions/logout.me',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				sessionId: String,
			});

			try {
				const { sessionId } = this.bodyParams;
				const sessionObj = await Sessions.findOneBySessionId(sessionId);

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

				await Sessions.updateOne({ sessionId }, { $set: { logoutAt: new Date(), logoutBy: this.userId } });
				return API.v1.success({ sessionId });
			} catch (error) {
				return API.v1.failure(`${error}`);
			}
		},
	},
);

API.v1.addRoute(
	'sessions/list.all',
	{ authRequired: true, twoFactorRequired: true },
	{
		async get() {
			if (!hasRole(this.userId, 'admin')) {
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

			try {
				const { offset, count } = this.getPaginationItems();
				let search = this.queryParams?.search || '';

				const searchUser = await Users.findUserBySearchOperator(search);
				if (searchUser?.length) {
					search += ` ${searchUser.map((user) => user._id).join(' ')}`;
				}

				const sessions = await Sessions.getAllSessions(search, { offset, count });
				return API.v1.success(sessions);
			} catch (error) {
				return API.v1.failure(`${error}`);
			}
		},
	},
);

API.v1.addRoute(
	'sessions/logout',
	{ authRequired: true, twoFactorRequired: true },
	{
		async post() {
			if (!hasPermission(this.userId, 'logout-other-user') && !hasRole(this.userId, 'admin')) {
				return API.v1.unauthorized();
			}

			check(this.bodyParams, {
				sessionId: String,
			});

			try {
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

				await Sessions.updateOne({ sessionId }, { $set: { logoutAt: new Date(), logoutBy: this.userId } });
				return API.v1.success({ sessionId });
			} catch (error) {
				return API.v1.failure(`${error}`);
			}
		},
	},
);
