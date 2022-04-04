import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../../../utils/client';
import { LivechatInquiry } from '../../collections/LivechatInquiry';
import { inquiryDataStream } from './inquiry';
import { callWithErrorHandling } from '../../../../../client/lib/utils/callWithErrorHandling';
import { getUserPreference } from '../../../../utils';
import { CustomSounds } from '../../../../custom-sounds/client/lib/CustomSounds';

const departments = new Set();

const newInquirySound = () => {
	const userId = Meteor.userId();
	const audioVolume = getUserPreference(userId, 'notificationsSoundVolume');
	const newRoomNotification = getUserPreference(userId, 'newRoomNotification');

	if (newRoomNotification !== 'none') {
		CustomSounds.play(newRoomNotification, {
			volume: Number((audioVolume / 100).toPrecision(2)),
		});
	}
};

const events = {
	added: (inquiry) => {
		delete inquiry.type;
		departments.has(inquiry.department) && LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		newInquirySound();
	},
	changed: (inquiry) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !departments.has(inquiry.department))) {
			return LivechatInquiry.remove(inquiry._id);
		}
		delete inquiry.type;
		const saveResult = LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
		if (saveResult?.insertedId) {
			newInquirySound();
		}
	},
	removed: (inquiry) => LivechatInquiry.remove(inquiry._id),
};

const updateCollection = (inquiry) => {
	events[inquiry.type](inquiry);
};

const getInquiriesFromAPI = async () => {
	const { inquiries } = await APIClient.v1.get('livechat/inquiries.queuedForUser?sort={"ts": 1}');
	return inquiries;
};

const removeListenerOfDepartment = (departmentId) => {
	inquiryDataStream.removeListener(`department/${departmentId}`, updateCollection);
	departments.delete(departmentId);
};

const appendListenerToDepartment = (departmentId) => {
	departments.add(departmentId);
	inquiryDataStream.on(`department/${departmentId}`, updateCollection);
	return () => removeListenerOfDepartment(departmentId);
};
const addListenerForeachDepartment = (departments = []) => {
	const cleanupFunctions = departments.map((department) => appendListenerToDepartment(department));
	return () => cleanupFunctions.forEach((cleanup) => cleanup());
};

const updateInquiries = async (inquiries = []) =>
	inquiries.forEach((inquiry) => LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, _updatedAt: new Date(inquiry._updatedAt) }));

const getAgentsDepartments = async (userId) => {
	const { departments } = await APIClient.v1.get(`livechat/agents/${userId}/departments?enabledDepartmentsOnly=true`);
	return departments;
};

const removeGlobalListener = () => inquiryDataStream.removeListener('public', updateCollection);

const addGlobalListener = () => {
	inquiryDataStream.on('public', updateCollection);
	return removeGlobalListener;
};

const subscribe = async (userId) => {
	const config = await callWithErrorHandling('livechat:getRoutingConfig');
	if (config && config.autoAssignAgent) {
		return;
	}

	const agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);

	// Register to all depts + public queue always to match the inquiry list returned by backend
	const cleanDepartmentListeners = addListenerForeachDepartment(agentDepartments);
	const globalCleanup = addGlobalListener();

	updateInquiries(await getInquiriesFromAPI());

	return () => {
		LivechatInquiry.remove({});
		removeGlobalListener();
		cleanDepartmentListeners && cleanDepartmentListeners();
		globalCleanup && globalCleanup();
		departments.clear();
	};
};

export const initializeLivechatInquiryStream = (() => {
	let cleanUp;

	return async (...args) => {
		cleanUp && cleanUp();
		cleanUp = await subscribe(...args);
	};
})();
