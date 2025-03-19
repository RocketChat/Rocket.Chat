import type { ILivechatDepartment, ILivechatInquiryRecord, IOmnichannelAgent } from '@rocket.chat/core-typings';

import { queryClient } from '../../../../../client/lib/queryClient';
import { callWithErrorHandling } from '../../../../../client/lib/utils/callWithErrorHandling';
import { settings } from '../../../../settings/client';
import { sdk } from '../../../../utils/client/lib/SDKClient';
import { LivechatInquiry } from '../../collections/LivechatInquiry';

const departments = new Set();

const events = {
	added: async (inquiry: ILivechatInquiryRecord) => {
		if (!departments.has(inquiry.department)) {
			return;
		}

		LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		await invalidateRoomQueries(inquiry.rid);
	},
	changed: async (inquiry: ILivechatInquiryRecord) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !departments.has(inquiry.department))) {
			return removeInquiry(inquiry);
		}

		LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		await invalidateRoomQueries(inquiry.rid);
	},
	removed: (inquiry: ILivechatInquiryRecord) => removeInquiry(inquiry),
};

type InquiryEventType = keyof typeof events;
type InquiryEventArgs = { type: InquiryEventType } & Omit<ILivechatInquiryRecord, 'type'>;

const processInquiryEvent = async (args: unknown): Promise<void> => {
	if (!args || typeof args !== 'object' || !('type' in args)) {
		return;
	}

	const { type, ...inquiry } = args as InquiryEventArgs;
	if (type in events) {
		await events[type](inquiry as ILivechatInquiryRecord);
	}
};

const invalidateRoomQueries = async (rid: string) => {
	await queryClient.invalidateQueries({ queryKey: ['rooms', { reference: rid, type: 'l' }] });
	queryClient.removeQueries({ queryKey: ['rooms', rid] });
	queryClient.removeQueries({ queryKey: ['/v1/rooms.info', rid] });
};

const removeInquiry = async (inquiry: ILivechatInquiryRecord) => {
	LivechatInquiry.remove(inquiry._id);
	return queryClient.invalidateQueries({ queryKey: ['rooms', { reference: inquiry.rid, type: 'l' }] });
};

const getInquiriesFromAPI = async () => {
	const count = settings.get('Livechat_guest_pool_max_number_incoming_livechats_displayed') ?? 0;
	const { inquiries } = await sdk.rest.get('/v1/livechat/inquiries.queuedForUser', { count });
	return inquiries;
};

const removeListenerOfDepartment = (departmentId: ILivechatDepartment['_id']) => {
	sdk.stop('livechat-inquiry-queue-observer', `department/${departmentId}`);
	departments.delete(departmentId);
};

const appendListenerToDepartment = (departmentId: ILivechatDepartment['_id']) => {
	departments.add(departmentId);
	sdk.stream('livechat-inquiry-queue-observer', [`department/${departmentId}`], async (args) => {
		await processInquiryEvent(args);
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
		await processInquiryEvent(args);
	});
	return removeGlobalListener;
};

const removeAgentListener = (userId: IOmnichannelAgent['_id']) => {
	sdk.stop('livechat-inquiry-queue-observer', `agent/${userId}`);
};

const addAgentListener = (userId: IOmnichannelAgent['_id']) => {
	sdk.stream('livechat-inquiry-queue-observer', [`agent/${userId}`], async (args) => {
		await processInquiryEvent(args);
	});
	return () => removeAgentListener(userId);
};

const subscribe = async (userId: IOmnichannelAgent['_id']) => {
	const config = await callWithErrorHandling('livechat:getRoutingConfig');
	if (config?.autoAssignAgent) {
		return;
	}

	const agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);

	// Register to agent-specific queue, all depts + public queue to match the inquiry list returned by backend
	const cleanAgentListener = addAgentListener(userId);
	const cleanDepartmentListeners = addListenerForeachDepartment(agentDepartments);
	const globalCleanup = addGlobalListener();

	const computation = Tracker.autorun(async () => {
		const inquiriesFromAPI = (await getInquiriesFromAPI()) as unknown as ILivechatInquiryRecord[];

		await updateInquiries(inquiriesFromAPI);
	});

	return () => {
		LivechatInquiry.remove({});
		removeGlobalListener();
		cleanAgentListener?.();
		cleanDepartmentListeners?.();
		globalCleanup?.();
		departments.clear();
		computation.stop();
	};
};

export const initializeLivechatInquiryStream = (() => {
	let cleanUp: (() => void) | undefined;

	return async (...args: Parameters<typeof subscribe>) => {
		cleanUp?.();
		cleanUp = await subscribe(...args);
	};
})();
