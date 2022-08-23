import { isGETLivechatDepartmentProps, isPOSTLivechatDepartmentProps } from '@rocket.chat/rest-typings';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { hasPermission } from '../../../../authorization/server';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../../models/server';
import { Livechat } from '../../../server/lib/Livechat';
import {
	findDepartments,
	findDepartmentById,
	findDepartmentsToAutocomplete,
	findDepartmentsBetweenIds,
	findDepartmentAgents,
} from '../../../server/api/lib/departments';

API.v1.addRoute(
	'livechat/department',
	{
		authRequired: true,
		validateParams: { GET: isGETLivechatDepartmentProps, POST: isPOSTLivechatDepartmentProps },
		permissionsRequired: {
			GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' },
			POST: { permissions: ['manage-livechat-departments'], operation: 'hasAll' },
		},
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const { text, enabled, onlyMyDepartments, excludeDepartmentId } = this.queryParams;

			const { departments, total } = await findDepartments({
				userId: this.userId,
				text,
				enabled: enabled === 'true',
				onlyMyDepartments: onlyMyDepartments === 'true',
				excludeDepartmentId,
				pagination: {
					offset,
					count,
					// IMO, sort type shouldn't be record, but a generic of the model we're trying to sort
					// or the form { [k: keyof T]: number | string }
					sort: sort as any,
				},
			});

			return API.v1.success({ departments, count: departments.length, offset, total });
		},
		async post() {
			check(this.bodyParams, {
				department: Object,
				agents: Match.Maybe(Array),
			});

			const agents = this.bodyParams.agents ? { upsert: this.bodyParams.agents } : {};
			const department = Livechat.saveDepartment(null, this.bodyParams.department, agents);

			if (department) {
				return API.v1.success({
					department,
					agents: LivechatDepartmentAgents.find({ departmentId: department._id }).fetch(),
				});
			}

			return API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'livechat/department/:_id',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' },
			PUT: { permissions: ['manage-livechat-departments', 'add-livechat-department-agents'], operation: 'hasAny' },
			DELETE: { permissions: ['manage-livechat-departments', 'remove-livechat-department'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			check(this.urlParams, {
				_id: String,
			});

			const { onlyMyDepartments } = this.queryParams;

			const { department, agents } = await findDepartmentById({
				userId: this.userId,
				departmentId: this.urlParams._id,
				includeAgents: this.queryParams.includeAgents && this.queryParams.includeAgents === 'true',
				onlyMyDepartments: onlyMyDepartments === 'true',
			});

			// TODO: return 404 when department is not found
			// Currently, FE relies on the fact that this endpoint returns an empty payload
			// to show the "new" view. Returning 404 breaks it

			return API.v1.success({ department, agents });
		},
		put() {
			const permissionToSave = hasPermission(this.userId, 'manage-livechat-departments');
			const permissionToAddAgents = hasPermission(this.userId, 'add-livechat-department-agents');

			try {
				check(this.urlParams, {
					_id: String,
				});

				check(this.bodyParams, {
					department: Object,
					agents: Match.Maybe(Array),
				});

				const { _id } = this.urlParams;
				const { department, agents } = this.bodyParams;

				let success;
				if (permissionToSave) {
					success = Livechat.saveDepartment(_id, department);
				}

				if (success && agents && permissionToAddAgents) {
					success = Livechat.saveDepartmentAgents(_id, { upsert: agents });
				}

				if (success) {
					return API.v1.success({
						department: LivechatDepartment.findOneById(_id),
						agents: LivechatDepartmentAgents.find({ departmentId: _id }).fetch(),
					});
				}

				return API.v1.failure();
			} catch (e) {
				return API.v1.failure(e);
			}
		},
		delete() {
			try {
				check(this.urlParams, {
					_id: String,
				});

				if (Livechat.removeDepartment(this.urlParams._id)) {
					return API.v1.success();
				}
				return API.v1.failure();
			} catch (e) {
				return API.v1.failure(e);
			}
		},
	},
);

API.v1.addRoute(
	'livechat/department.autocomplete',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' } } },
	{
		async get() {
			const { selector, onlyMyDepartments } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				await findDepartmentsToAutocomplete({
					uid: this.userId,
					selector: JSON.parse(selector),
					onlyMyDepartments: onlyMyDepartments === 'true',
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/department/:departmentId/agents',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' },
			POST: { permissions: ['manage-livechat-departments', 'add-livechat-department-agents'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			check(this.urlParams, {
				departmentId: String,
			});

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const agents = await findDepartmentAgents({
				userId: this.userId,
				departmentId: this.urlParams.departmentId,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(agents);
		},
		post() {
			check(this.urlParams, {
				departmentId: String,
			});

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					upsert: Array,
					remove: Array,
				}),
			);
			Livechat.saveDepartmentAgents(this.urlParams.departmentId, this.bodyParams);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/department.listByIds',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' } } },
	{
		async get() {
			const { ids } = this.queryParams;
			const { fields } = this.parseJsonQuery();
			if (!ids) {
				return API.v1.failure("The 'ids' param is required");
			}
			if (!Array.isArray(ids)) {
				return API.v1.failure("The 'ids' param must be an array");
			}

			return API.v1.success(
				await findDepartmentsBetweenIds({
					ids,
					fields,
				}),
			);
		},
	},
);
