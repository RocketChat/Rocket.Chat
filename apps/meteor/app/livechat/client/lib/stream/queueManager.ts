import type { ILivechatDepartment, ILivechatInquiryRecord, IOmnichannelAgent } from '@rocket.chat/core-typings';

import { queryClient } from '../../../../../client/lib/queryClient';
import { callWithErrorHandling } from '../../../../../client/lib/utils/callWithErrorHandling';
import { sdk } from '../../../../utils/client/lib/SDKClient';
import { LivechatInquiry } from '../../collections/LivechatInquiry';

const departments = new Set();

const events = {
	added: (inquiry: ILivechatInquiryRecord) => {
		departments.has(inquiry.department) && LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
	},
	changed: async (inquiry: ILivechatInquiryRecord) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !departments.has(inquiry.department))) {
			return LivechatInquiry.remove(inquiry._id);
		}

		LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		await queryClient.invalidateQueries(['/v1/rooms.info', inquiry.rid]);
	},
	removed: (inquiry: ILivechatInquiryRecord) => LivechatInquiry.remove(inquiry._id),
};

const getInquiriesFromAPI = async () => {
	const { inquiries } = await sdk.rest.get('/v1/livechat/inquiries.queuedForUser', {});
	return inquiries;
};

const removeListenerOfDepartment = (departmentId: ILivechatDepartment['_id']) => {
	sdk.stop('livechat-inquiry-queue-observer', `department/${departmentId}`);
	departments.delete(departmentId);
};

const appendListenerToDepartment = (departmentId: ILivechatDepartment['_id']) => {
	departments.add(departmentId);
	sdk.stream('livechat-inquiry-queue-observer', [`department/${departmentId}`], async (args) => {
		if (!('type' in args)) {
			return;
		}
		const { type, ...inquiry } = args;
		await events[args.type](inquiry);
	});
	return () => removeListenerOfDepartment(departmentId);
};
const addListenerForeachDepartment = (departments: ILivechatDepartment['_id'][] = []) => {
	const cleanupFunctions = departments.map((department) => appendListenerToDepartment(department));
	return () => cleanupFunctions.forEach((cleanup) => cleanup());
};

const updateInquiries = async (inquiries: ILivechatInquiryRecord[] = []) =>
	inquiries.forEach((inquiry) => LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, _updatedAt: new Date(inquiry._updatedAt) }));

const getAgentsDepartments = async (userId: IOmnichannelAgent['_id']) => {
	const { departments } = await sdk.rest.get(`/v1/livechat/agents/${userId}/departments`, { enabledDepartmentsOnly: 'true' });
	return departments;
};

const removeGlobalListener = () => sdk.stop('livechat-inquiry-queue-observer', 'public');

const addGlobalListener = () => {
	sdk.stream('livechat-inquiry-queue-observer', ['public'], async (args) => {
		if (!('type' in args)) {
			return;
		}
		const { type, ...inquiry } = args;
		await events[args.type](inquiry);
	});
	return removeGlobalListener;
};

const subscribe = async (userId: IOmnichannelAgent['_id']) => {
	const config = await callWithErrorHandling('livechat:getRoutingConfig');
	if (config?.autoAssignAgent) {
		return;
	}

	const agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);

	// Register to all depts + public queue always to match the inquiry list returned by backend
	const cleanDepartmentListeners = addListenerForeachDepartment(agentDepartments);
	const globalCleanup = addGlobalListener();
	const inquiriesFromAPI = (await getInquiriesFromAPI()) as unknown as ILivechatInquiryRecord[];

	await updateInquiries(inquiriesFromAPI);

	return () => {
		LivechatInquiry.remove({});
		removeGlobalListener();
		cleanDepartmentListeners?.();
		globalCleanup?.();
		departments.clear();
	};
};

export const initializeLivechatInquiryStream = (() => {
	let cleanUp: (() => void) | undefined;

	return async (...args: any[]) => {
		cleanUp?.();
		cleanUp = await subscribe(...(args as [IOmnichannelAgent['_id']]));
	};
})();
