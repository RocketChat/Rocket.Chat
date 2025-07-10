import { Users } from '@rocket.chat/models';
import { isLivechatUsersManagerGETProps, isPOSTLivechatUsersTypeProps } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

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
			if (!['agent', 'manager'].includes(this.urlParams.type)) {
				throw new Error('Invalid type');
			}
			const role = this.urlParams.type === 'agent' ? 'livechat-agent' : 'livechat-manager';

			const user = await Users.findOneByIdAndRole(this.urlParams._id, role, {
				projection: { _id: 1, username: 1, name: 1, status: 1, statusLivechat: 1, emails: 1, livechat: 1 },
			});

			// TODO: throw error instead of returning null
			return API.v1.success({ user });
		},
		async delete() {
			if (this.urlParams.type === 'agent') {
				if (await removeAgent(this.urlParams._id)) {
					return API.v1.success();
				}
			} else if (this.urlParams.type === 'manager') {
				if (await removeManager(this.urlParams._id)) {
					return API.v1.success();
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		},
	},
);
