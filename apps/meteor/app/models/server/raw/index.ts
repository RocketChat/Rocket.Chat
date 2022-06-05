import { api } from '../../../../server/sdk/api';
import { BaseDbWatch } from '../models/_BaseDb';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { isRunningMs } from '../../../../server/lib/isRunningMs';

const map = {
	[Messages.col.collectionName]: MessagesModel,
	[Users.col.collectionName]: UsersModel,
	[Subscriptions.col.collectionName]: SubscriptionsModel,
	[Settings.col.collectionName]: SettingsModel,
	[LivechatInquiry.col.collectionName]: LivechatInquiryModel,
	[LivechatDepartmentAgents.col.collectionName]: LivechatDepartmentAgentsModel,
	[Rooms.col.collectionName]: RoomsModel,
};

if (!isRunningMs()) {
	const models = {
		Messages,
		Users,
		Subscriptions,
		Settings,
		LivechatInquiry,
		LivechatDepartmentAgents,
		UsersSessions,
		Permissions,
		Roles,
		Rooms,
		LoginServiceConfiguration,
		InstanceStatus,
		IntegrationHistory,
		Integrations,
		EmailInbox,
		PbxEvent,
	};

	initWatchers(models, api.broadcastLocal.bind(api), (model, fn) => {
		const meteorModel = map[model.col.collectionName] || new BaseDbWatch(model.col.collectionName);
		if (!meteorModel) {
			return;
		}

		meteorModel.on('change', fn);
	});
}
