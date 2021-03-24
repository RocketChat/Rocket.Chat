import { APIClient } from '../../../../utils/client';
import { LivechatInquiry } from '../../collections/LivechatInquiry';
import { inquiryDataStream } from './inquiry';
import { call } from '../../../../ui-utils/client';

const departments = new Set();

const events = {
	added: (inquiry) => {
		delete inquiry.type;
		departments.has(inquiry.department) && LivechatInquiry.insert({ ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
	},
	changed: (inquiry) => {
		if (inquiry.status !== 'queued' || (inquiry.department && !departments.has(inquiry.department))) {
			return LivechatInquiry.remove(inquiry._id);
		}
		delete inquiry.type;
		LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, alert: true, _updatedAt: new Date(inquiry._updatedAt) });
	},
	removed: (inquiry) => LivechatInquiry.remove(inquiry._id),
};

const updateCollection = (inquiry) => { events[inquiry.type](inquiry); };

const getInquiriesFromAPI = async () => {
	const { inquiries } = await APIClient.v1.get('livechat/inquiries.queued?sort={"ts": 1}');
	return inquiries;
};

const removeListenerOfDepartment = (departmentId) => {
	inquiryDataStream.removeListener(`department/${ departmentId }`, updateCollection);
	departments.delete(departmentId);
};

const appendListenerToDepartment = (departmentId) => {
	departments.add(departmentId);
	inquiryDataStream.on(`department/${ departmentId }`, updateCollection);
	return () => removeListenerOfDepartment(departmentId);
};
const addListenerForeachDepartment = async (departments = []) => {
	const cleanupFunctions = departments.map((department) => appendListenerToDepartment(department));
	return () => cleanupFunctions.forEach((cleanup) => cleanup());
};


const updateInquiries = async (inquiries = []) => inquiries.forEach((inquiry) => LivechatInquiry.upsert({ _id: inquiry._id }, { ...inquiry, _updatedAt: new Date(inquiry._updatedAt) }));

const getAgentsDepartments = async (userId) => {
	const { departments } = await APIClient.v1.get(`livechat/agents/${ userId }/departments?enabledDepartmentsOnly=true`);
	return departments;
};

const removeGlobalListener = () => inquiryDataStream.removeListener('public', updateCollection);

const addGlobalListener = () => {
	inquiryDataStream.on('public', updateCollection);
	return removeGlobalListener;
};


const subscribe = async (userId) => {
	const config = await call('livechat:getRoutingConfig');
	if (config && config.autoAssignAgent) {
		return;
	}

	const agentDepartments = (await getAgentsDepartments(userId)).map((department) => department.departmentId);

	const cleanUp = agentDepartments.length ? await addListenerForeachDepartment(agentDepartments) : addGlobalListener();

	updateInquiries(await getInquiriesFromAPI());

	return () => {
		LivechatInquiry.remove({});
		removeGlobalListener();
		cleanUp && cleanUp();
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
