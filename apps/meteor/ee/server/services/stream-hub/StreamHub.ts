import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { getConnection } from '../mongo';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { MessagesRaw } from '../../../../server/models/raw/Messages';
import { UsersRaw } from '../../../../server/models/raw/Users';
import { SubscriptionsRaw } from '../../../../server/models/raw/Subscriptions';
import { SettingsRaw } from '../../../../server/models/raw/Settings';
import { RolesRaw } from '../../../../server/models/raw/Roles';
import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';
import { UsersSessionsRaw } from '../../../../server/models/raw/UsersSessions';
import { RoomsRaw } from '../../../../server/models/raw/Rooms';
import { LoginServiceConfigurationRaw } from '../../../../server/models/raw/LoginServiceConfiguration';
import { InstanceStatusRaw } from '../../../../server/models/raw/InstanceStatus';
import { IntegrationHistoryRaw } from '../../../../server/models/raw/IntegrationHistory';
import { LivechatDepartmentAgentsRaw } from '../../../../server/models/raw/LivechatDepartmentAgents';
import { IntegrationsRaw } from '../../../../server/models/raw/Integrations';
import { PermissionsRaw } from '../../../../server/models/raw/Permissions';
import { EmailInboxRaw } from '../../../../server/models/raw/EmailInbox';
import { PbxEventsRaw } from '../../../../server/models/raw/PbxEvents';
import { api } from '../../../../server/sdk/api';
import { DatabaseWatcher } from '../../../../server/database/DatabaseWatcher';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection(1);

		const Rooms = new RoomsRaw(db);
		const Settings = new SettingsRaw(db);
		const Users = new UsersRaw(db);
		const UsersSessions = new UsersSessionsRaw(db);
		const Subscriptions = new SubscriptionsRaw(db);
		const LivechatInquiry = new LivechatInquiryRaw(db);
		const LivechatDepartmentAgents = new LivechatDepartmentAgentsRaw(db);
		const Messages = new MessagesRaw(db);
		const Permissions = new PermissionsRaw(db);
		const Roles = new RolesRaw(db);
		const LoginServiceConfiguration = new LoginServiceConfigurationRaw(db);
		const InstanceStatus = new InstanceStatusRaw(db);
		const IntegrationHistory = new IntegrationHistoryRaw(db);
		const Integrations = new IntegrationsRaw(db);
		const EmailInbox = new EmailInboxRaw(db);
		const PbxEvents = new PbxEventsRaw(db);

		const watchCollections = [
			Messages.getCollectionName(),
			Users.getCollectionName(),
			Subscriptions.getCollectionName(),
			LivechatInquiry.getCollectionName(),
			LivechatDepartmentAgents.getCollectionName(),
			UsersSessions.getCollectionName(),
			Permissions.getCollectionName(),
			Roles.getCollectionName(),
			Rooms.getCollectionName(),
			LoginServiceConfiguration.getCollectionName(),
			InstanceStatus.getCollectionName(),
			IntegrationHistory.getCollectionName(),
			Integrations.getCollectionName(),
			EmailInbox.getCollectionName(),
			PbxEvents.getCollectionName(),
			Settings.getCollectionName(),
		];

		const watcher = new DatabaseWatcher({ db, watchCollections });

		initWatchers(watcher, api.broadcast.bind(api));

		watcher.watch();
	}
}
