import { Users } from '@rocket.chat/models';
import { isLivechatUsersManagerGETProps, isPOSTLivechatUsersTypeProps } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';
import _ from 'underscore';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { hasAtLeastOnePermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { findAgents, findManagers } from '../../../server/api/lib/users';
import { addManager, addAgent, removeAgent, removeManager } from '../../../server/lib/omni-users';

const emptyStringArray: string[] = [];

API.v1.addRoute(
	'livechat/users/:type',
	{
		authRequired: true,
		permissionsRequired: {
			'POST': ['view-livechat-manager'],
			'*': emptyStringArray,
		},
		validateParams: {
			GET: isLivechatUsersManagerGETProps,
			POST: isPOSTLivechatUsersTypeProps,
		},
	},
	{
		async get() {
			check(this.urlParams, {
				type: String,
			});
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text } = this.queryParams;

			if (this.urlParams.type === 'agent') {
				if (!(await hasAtLeastOnePermissionAsync(this.userId, ['transfer-livechat-guest', 'edit-omnichannel-contact']))) {
					return API.v1.forbidden();
				}

				const { onlyAvailable, excludeId, showIdleAgents } = this.queryParams;
				return API.v1.success(
					await findAgents({
						text,
						onlyAvailable,
						excludeId,
						showIdleAgents,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				);
			}
			if (this.urlParams.type === 'manager') {
				if (!(await hasAtLeastOnePermissionAsync(this.userId, ['view-livechat-manager']))) {
					return API.v1.forbidden();
				}

				return API.v1.success(
					await findManagers({
						text,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				);
			}
			throw new Error('Invalid type');
		},
		async post() {
			if (this.urlParams.type === 'agent') {
				const user = await addAgent(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else if (this.urlParams.type === 'manager') {
				const user = await addManager(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'livechat/users/:type/:_id',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const user = await Users.findOneById(this.urlParams._id);

			if (!user) {
				return API.v1.failure('User not found');
			}

			let role;

			if (this.urlParams.type === 'agent') {
				role = 'livechat-agent';
			} else if (this.urlParams.type === 'manager') {
				role = 'livechat-manager';
			} else {
				throw new Error('Invalid type');
			}

			if (user.roles.indexOf(role) !== -1) {
				return API.v1.success({
					user: _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat', 'emails', 'livechat'),
				});
			}

			return API.v1.success({
				user: null,
			});
		},
		async delete() {
			const user = await Users.findOneById(this.urlParams._id);

			if (!user?.username) {
				return API.v1.failure();
			}

			if (this.urlParams.type === 'agent') {
				if (await removeAgent(user.username)) {
					return API.v1.success();
				}
			} else if (this.urlParams.type === 'manager') {
				if (await removeManager(user.username)) {
					return API.v1.success();
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		},
	},
);
