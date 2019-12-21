import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../../../utils/client';
import { getLivechatInquiryCollection } from '../../collections/LivechatInquiry';
import { LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';
import { hasRole } from '../../../../authorization/client';

const livechatInquiryStreamer = new Meteor.Streamer('livechat-inquiry');
let agentDepartments = [];

const events = {
	added: (inquiry, collection) => collection.insert(inquiry),
	changed: (inquiry, collection) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !agentDepartments.includes(inquiry.department))) {
			return collection.remove({ _id: inquiry._id });
		}
		delete inquiry.type;
		collection.upsert({ _id: inquiry._id }, inquiry);
	},
	removed: (inquiry, collection) => collection.remove({ _id: inquiry._id }),
};

const appendListenerToDepartment = (departmentId, collection) => livechatInquiryStreamer.on(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ departmentId }`, (inquiry) => events[inquiry.type](inquiry, collection));

const removeListenerOfDepartment = (departmentId) => livechatInquiryStreamer.removeListener(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ departmentId }`);

const getInquiriesFromAPI = async (url) => {
	const { inquiries } = await APIClient.v1.get(url);
	return inquiries;
};

const updateInquiries = async (inquiries) => {
	const collection = getLivechatInquiryCollection();
	(inquiries || []).forEach((inquiry) => collection.upsert({ _id: inquiry._id }, inquiry));
};

const getDepartments = async (userId) => {
	const { departments } = await APIClient.v1.get(`livechat/agents/${ userId }/departments`);
	return departments;
};

const addListenerForeachDepartment = async (userId, departments) => {
	const collection = getLivechatInquiryCollection();
	agentDepartments = departments.map((department) => department.departmentId);
	if (departments && Array.isArray(departments) && departments.length) {
		departments.forEach((department) => appendListenerToDepartment(department.departmentId, collection));
	}
};

export const initializeLivechatInquiryStream = async (userId) => {
	const collection = getLivechatInquiryCollection();
	await updateInquiries(await getInquiriesFromAPI('livechat/inquiries.queued?sort={"ts": 1}'));
	const departments = await getDepartments(userId);
	await addListenerForeachDepartment(userId, departments);
	if (departments.length === 0 || hasRole(userId, 'livechat-manager')) {
		livechatInquiryStreamer.on(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, (inquiry) => events[inquiry.type](inquiry, collection));
	}
};

export const removeInquiriesByDepartment = (department) => {
	const collection = getLivechatInquiryCollection();
	collection.remove({ department });
	removeListenerOfDepartment(department);
	agentDepartments = agentDepartments.filter((agentDepartment) => agentDepartment !== department);
};

export const addInquiriesAndListenerByDepartment = async (department) => {
	const collection = getLivechatInquiryCollection();
	await updateInquiries(await getInquiriesFromAPI(`livechat/inquiries.queued?sort={"ts": 1}&department=${ department }`));
	appendListenerToDepartment(department, collection);
	agentDepartments.push(department);
};
