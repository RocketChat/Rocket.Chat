import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents } from '@rocket.chat/models';
import { isGETLivechatDepartmentProps, isPOSTLivechatDepartmentProps } from '@rocket.chat/rest-typings';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { settings } from '../../../../settings/server';
import {
	findDepartments,
	findDepartmentById,
	findDepartmentsToAutocomplete,
	findDepartmentsBetweenIds,
	findDepartmentAgents,
	findArchivedDepartments,
} from '../../../server/api/lib/departments';
import {
	saveDepartment,
	archiveDepartment,
	unarchiveDepartment,
	saveDepartmentAgents,
	removeDepartment,
} from '../../../server/lib/departmentsLib';
import { isDepartmentCreationAvailable } from '../../../server/lib/isDepartmentCreationAvailable';

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
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const { text, enabled, onlyMyDepartments, excludeDepartmentId, showArchived } = this.queryParams;

			const { departments, total } = await findDepartments({
				userId: this.userId,
				text,
				enabled: enabled === 'true',
				showArchived: showArchived === 'true',
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
				departmentUnit: Match.Maybe({ _id: Match.Optional(String) }),
			});

			const agents = this.bodyParams.agents ? { upsert: this.bodyParams.agents } : {};
			const { departmentUnit } = this.bodyParams;
			const department = await saveDepartment(
				this.userId,
				null,
				this.bodyParams.department as ILivechatDepartment,
				agents,
				departmentUnit || {},
			);

			if (department) {
				return API.v1.success({
					department,
					agents: await LivechatDepartmentAgents.find({ departmentId: department._id }).toArray(),
				});
			}

			return API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'livechat/department/isDepartmentCreationAvailable',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-livechat-departments', 'manage-livechat-departments'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			const available = await isDepartmentCreationAvailable();
			return API.v1.success({ isDepartmentCreationAvailable: available });
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
		async put() {
			const permissionToSave = await hasPermissionAsync(this.userId, 'manage-livechat-departments');
			const permissionToAddAgents = await hasPermissionAsync(this.userId, 'add-livechat-department-agents');

			check(this.bodyParams, {
				department: Object,
				agents: Match.Maybe(Array),
				departmentUnit: Match.Maybe({ _id: Match.Optional(String) }),
			});

			const { _id } = this.urlParams;
			const { department, agents, departmentUnit } = this.bodyParams;

			if (!permissionToSave) {
				throw new Error('error-not-allowed');
			}

			const agentParam = permissionToAddAgents && agents ? { upsert: agents } : {};
			await saveDepartment(this.userId, _id, department, agentParam, departmentUnit || {});

			return API.v1.success({
				department: await LivechatDepartment.findOneById(_id),
				agents: await LivechatDepartmentAgents.findByDepartmentId(_id).toArray(),
			});
		},
		async delete() {
			check(this.urlParams, {
				_id: String,
			});

			const isRemoveEnabled = settings.get<boolean>('Omnichannel_enable_department_removal');

			if (!isRemoveEnabled) {
				return API.v1.failure('error-department-removal-disabled');
			}

			await removeDepartment(this.urlParams._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/departments/archived',
	{
		authRequired: true,
		validateParams: { GET: isGETLivechatDepartmentProps },
		permissionsRequired: {
			GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const { text, onlyMyDepartments, excludeDepartmentId } = this.queryParams;

			const { departments, total } = await findArchivedDepartments({
				userId: this.userId,
				text,
				onlyMyDepartments: onlyMyDepartments === 'true',
				excludeDepartmentId,
				pagination: {
					offset,
					count,
					sort: sort as any,
				},
			});

			return API.v1.success({ departments, count: departments.length, offset, total });
		},
	},
);

API.v1.addRoute(
	'livechat/department/:_id/archive',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-departments'],
	},
	{
		async post() {
			await archiveDepartment(this.urlParams._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/department/:_id/unarchive',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-departments'],
	},
	{
		async post() {
			await unarchiveDepartment(this.urlParams._id);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/department.autocomplete',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-livechat-departments', 'view-l-room'], operation: 'hasAny' } } },
	{
		async get() {
			const { selector, onlyMyDepartments, showArchived } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				await findDepartmentsToAutocomplete({
					uid: this.userId,
					selector: JSON.parse(selector),
					onlyMyDepartments: onlyMyDepartments === 'true',
					showArchived: showArchived === 'true',
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/department/:_id/agents',
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
				_id: String,
			});
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const agents = await findDepartmentAgents({
				userId: this.userId,
				departmentId: this.urlParams._id,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(agents);
		},
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					upsert: Array,
					remove: Array,
				}),
			);
			await saveDepartmentAgents(this.urlParams._id, this.bodyParams);

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
			const { fields } = await this.parseJsonQuery();
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
