import type { ILivechatDepartment, ILivechatInquiryRecord, IOmnichannelAgent } from '@rocket.chat/core-typings';

import { LivechatInquiry } from '../../collections/LivechatInquiry';
import { callWithErrorHandling } from '../../../../../client/lib/utils/callWithErrorHandling';
import { sdk } from '../../../../utils/client/lib/SDKClient';

const departments = new Set();

type ILivechatInquiryWithType = ILivechatInquiryRecord & { type?: 'added' | 'removed' | 'changed' };

const events = {
	added: (inquiry: ILivechatInquiryWithType) => {
		delete inquiry.type;
		departments.has(inquiry.department) && LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
	},
	changed: (inquiry: ILivechatInquiryWithType) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !departments.has(inquiry.department))) {
			return LivechatInquiry.remove(inquiry._id);
		}
		delete inquiry.type;
		LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
	},
	removed: (inquiry: ILivechatInquiryWithType) => LivechatInquiry.remove(inquiry._id),
};

const updateCollection = (inquiry: ILivechatInquiryWithType) => {
	if (!inquiry.type) {
		return;
	}
	events[inquiry.type](inquiry);
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
	sdk.stream('livechat-inquiry-queue-observer', [`department/${departmentId}`], updateCollection);
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
	sdk.stream('livechat-inquiry-queue-observer', ['public'], updateCollection);
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
