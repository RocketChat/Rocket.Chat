import moment from 'moment';

import { APIClient } from '../../../../utils/client';
import { LivechatInquiry } from '../../collections/LivechatInquiry';
import { inquiryDataStream } from './inquiry';
import { hasRole } from '../../../../authorization/client';
import { call } from '../../../../ui-utils/client';
import { settings } from '../../../../settings/client';

let agentDepartments = [];
const queueDetails = {
	loadedFrom: undefined,
	serverLastInquiryTimestamp: new Date(),
	streamActionsToApply: [],
	isLoadingFromServer: false,
};

const actions = {
	remove: (inquiry) => LivechatInquiry.remove(inquiry._id),
	upsert: (inquiry) => LivechatInquiry.upsert({ _id: inquiry._id }, inquiry),
};

const applyDataToQueue = (action) => {
	if (queueDetails.isLoadingFromServer) {
		queueDetails.streamActionsToApply.push(action);
		return;
	}
	return actions[action.action](action.inquiry);
};

const events = {
	added: (inquiry) => {
		queueDetails.serverLastInquiryTimestamp = inquiry.queueUpdatedAt;
	},
	changed: (inquiry) => {
		const mustDelete = inquiry.status !== 'queued' || (inquiry.department && !agentDepartments.includes(inquiry.department));
		if (mustDelete) {
			applyDataToQueue({ action: 'remove', inquiry });
		}
		delete inquiry.type;
		applyDataToQueue({ action: 'upsert', inquiry });
	},
	removed: (inquiry) => {
		applyDataToQueue({ action: 'remove', inquiry });
	},
};

const updateCollection = (inquiry) => { events[inquiry.type](inquiry); };
const appendListenerToDepartment = (departmentId) => inquiryDataStream.on(`department/${ departmentId }`, updateCollection);
const removeListenerOfDepartment = (departmentId) => inquiryDataStream.removeListener(`department/${ departmentId }`, updateCollection);

const getInquiriesFromAPI = async (url) => APIClient.v1.get(url);

const updateInquiries = (inquiries) => {
	(inquiries || []).forEach((inquiry) => LivechatInquiry.upsert({ _id: inquiry._id }, inquiry));
};

const getAgentsDepartments = async (userId) => {
	const { departments } = await APIClient.v1.get(`livechat/agents/${ userId }/departments?enabledDepartmentsOnly=true`);
	return departments;
};

const addListenerForeachDepartment = async (userId, departments) => {
	if (departments && Array.isArray(departments) && departments.length) {
		departments.forEach((department) => appendListenerToDepartment(department));
	}
};

const removeDepartmentsListeners = (departments) => {
	(departments || []).forEach((department) => removeListenerOfDepartment(department._id));
};

const removeGlobalListener = () => {
	inquiryDataStream.removeListener('public', updateCollection);
};

const updateQueueDetails = (inquiries = [], count, total) => {
	if (total <= count) {
		queueDetails.loadedFrom = new Date();
		return;
	}
	const newestInquiry = inquiries[inquiries.length - 1];
	queueDetails.loadedFrom = newestInquiry && newestInquiry.ts;
};

const applyDataFromStream = () => {
	queueDetails.streamActionsToApply.forEach((action) => actions[action.action](action.inquiry));
	queueDetails.streamActionsToApply = [];
};

const loadInquiriesFromTheServer = async (maxNumberOfLivechats) => {
	if (queueDetails.loadedFrom && moment(queueDetails.loadedFrom).isAfter(queueDetails.serverLastInquiryTimestamp)) {
		return;
	}
	const from = queueDetails.loadedFrom ? `?from=${ moment(queueDetails.loadedFrom).utc().format('YYYY-MM-DDTHH:mm:ss.SSS') }Z` : '';
	const roomsCount = maxNumberOfLivechats ? `${ from ? '&' : '?' }count=${ maxNumberOfLivechats }` : '';
	queueDetails.isLoadingFromServer = true;
	const { inquiries, count, total } = await getInquiriesFromAPI(`livechat/inquiries.queued${ from }${ roomsCount }`);
	updateQueueDetails(inquiries, count, total);
	updateInquiries(inquiries);
	queueDetails.isLoadingFromServer = false;
	applyDataFromStream();
};

const poolingServerForInquiryList = async (maxNumberOfLivechats) => {
	const intervalToFetchInSeconds = (settings.get('Livechat_guest_pool_interval_to_fetch_rooms_in_seconds') * 1000) || 5000;
	setInterval(() => {
		loadInquiriesFromTheServer(maxNumberOfLivechats);
	}, intervalToFetchInSeconds);
};

export const initializeLivechatInquiryStream = async (userId, maxNumberOfLivechats) => {
	LivechatInquiry.remove({});

	if (agentDepartments.length) {
		removeDepartmentsListeners(agentDepartments);
	}
	removeGlobalListener();

	const config = await call('livechat:getRoutingConfig');
	if (config && config.autoAssignAgent) {
		return;
	}
	agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);
	await addListenerForeachDepartment(userId, agentDepartments);
	if (agentDepartments.length === 0 || hasRole(userId, 'livechat-manager')) {
		inquiryDataStream.on('public', updateCollection);
	}
	poolingServerForInquiryList(maxNumberOfLivechats);
	loadInquiriesFromTheServer(maxNumberOfLivechats);
};
