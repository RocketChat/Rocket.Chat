import { APIClient } from '../../../../utils/client';
import { getLivechatInquiryCollection } from '../../collections/LivechatInquiry';
import { inquiryDataStream } from './inquiry';
import { hasRole } from '../../../../authorization/client';

let agentDepartments = [];
const collection = getLivechatInquiryCollection();

const events = {
	added: (inquiry) => {
		delete inquiry.type;
		collection.insert(inquiry);
	},
	changed: (inquiry) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !agentDepartments.includes(inquiry.department))) {
			return collection.remove(inquiry._id);
		}
		delete inquiry.type;
		collection.upsert({ _id: inquiry._id }, inquiry);
	},
	removed: (inquiry) => collection.remove(inquiry._id),
};

const updateCollection = (inquiry) => { events[inquiry.type](inquiry); };
const appendListenerToDepartment = (departmentId) => inquiryDataStream.on(`department/${ departmentId }`, updateCollection);
const removeListenerOfDepartment = (departmentId) => inquiryDataStream.removeListener(`department/${ departmentId }`, updateCollection);

const getInquiriesFromAPI = async (url) => {
	const { inquiries } = await APIClient.v1.get(url);
	return inquiries;
};

const updateInquiries = async (inquiries) => {
	(inquiries || []).forEach((inquiry) => collection.upsert({ _id: inquiry._id }, inquiry));
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

export const initializeLivechatInquiryStream = async (userId) => {
	collection.remove({});
	if (agentDepartments.length) {
		removeDepartmentsListeners(agentDepartments);
	}
	removeGlobalListener();
	await updateInquiries(await getInquiriesFromAPI('livechat/inquiries.queued?sort={"ts": 1}'));
	agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);
	await addListenerForeachDepartment(userId, agentDepartments);
	if (agentDepartments.length === 0 || hasRole(userId, 'livechat-manager')) {
		inquiryDataStream.on('public', updateCollection);
	}
};
