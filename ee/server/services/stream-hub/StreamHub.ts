import { getConnection } from '../mongo';
import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { MessagesRaw } from '../../../../app/models/server/raw/Messages';
import { UsersRaw } from '../../../../app/models/server/raw/Users';
import { SubscriptionsRaw } from '../../../../app/models/server/raw/Subscriptions';
import { SettingsRaw } from '../../../../app/models/server/raw/Settings';
import { RolesRaw } from '../../../../app/models/server/raw/Roles';
import { LivechatInquiryRaw } from '../../../../app/models/server/raw/LivechatInquiry';
import { UsersSessionsRaw } from '../../../../app/models/server/raw/UsersSessions';
import { RoomsRaw } from '../../../../app/models/server/raw/Rooms';
import { LoginServiceConfigurationRaw } from '../../../../app/models/server/raw/LoginServiceConfiguration';
import { InstanceStatusRaw } from '../../../../app/models/server/raw/InstanceStatus';
import { IntegrationHistoryRaw } from '../../../../app/models/server/raw/IntegrationHistory';
import { LivechatDepartmentAgentsRaw } from '../../../../app/models/server/raw/LivechatDepartmentAgents';
import { IntegrationsRaw } from '../../../../app/models/server/raw/Integrations';
import { PermissionsRaw } from '../../../../app/models/server/raw/Permissions';
import { EmailInboxRaw } from '../../../../app/models/server/raw/EmailInbox';
import { PbxEventsRaw } from '../../../../app/models/server/raw/PbxEvents';
import { api } from '../../../../server/sdk/api';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection(15);

		const Trash = db.collection('rocketchat__trash');

		const UsersCol = db.collection('users');

		const Rooms = new RoomsRaw(db.collection('rocketchat_room'), Trash);
		const Settings = new SettingsRaw(db.collection('rocketchat_settings'), Trash);
		const Users = new UsersRaw(UsersCol, Trash);
		const UsersSessions = new UsersSessionsRaw(db.collection('usersSessions'), Trash, {
			preventSetUpdatedAt: true,
		});
		const Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'), { Users }, Trash);
		const LivechatInquiry = new LivechatInquiryRaw(db.collection('rocketchat_livechat_inquiry'), Trash);
		const LivechatDepartmentAgents = new LivechatDepartmentAgentsRaw(db.collection('rocketchat_livechat_department_agents'), Trash);
		const Messages = new MessagesRaw(db.collection('rocketchat_message'), Trash);
		const Permissions = new PermissionsRaw(db.collection('rocketchat_permissions'), Trash);
		const Roles = new RolesRaw(db.collection('rocketchat_roles'), { Users, Subscriptions }, Trash);
		const LoginServiceConfiguration = new LoginServiceConfigurationRaw(db.collection('meteor_accounts_loginServiceConfiguration'), Trash);
		const InstanceStatus = new InstanceStatusRaw(db.collection('instances'), Trash);
		const IntegrationHistory = new IntegrationHistoryRaw(db.collection('rocketchat_integration_history'), Trash);
		const Integrations = new IntegrationsRaw(db.collection('rocketchat_integrations'), Trash);
		const EmailInbox = new EmailInboxRaw(db.collection('rocketchat_email_inbox'), Trash);
		const PbxEvent = new PbxEventsRaw(db.collection('pbx_events'), Trash);

		const models = {
			Messages,
			Users,
			UsersSessions,
			Subscriptions,
			Permissions,
			LivechatInquiry,
			LivechatDepartmentAgents,
			Settings,
			Roles,
			Rooms,
			LoginServiceConfiguration,
			InstanceStatus,
			IntegrationHistory,
			Integrations,
			EmailInbox,
			PbxEvent,
		};

		initWatchers(models, api.broadcast.bind(api), (model, fn) => {
			model.col.watch([]).on('change', (event) => {
				switch (event.operationType) {
					case 'insert':
						fn({
							action: 'insert',
							clientAction: 'inserted',
							id: event.documentKey._id,
							data: event.fullDocument,
						});

						break;
					case 'update':
						const diff: Record<string, any> = {};

						if (event.updateDescription.updatedFields) {
							for (const key in event.updateDescription.updatedFields) {
								if (event.updateDescription.updatedFields.hasOwnProperty(key)) {
									diff[key] = event.updateDescription.updatedFields[key];
								}
							}
						}

						const unset: Record<string, number> = {};
						if (event.updateDescription.removedFields) {
							for (const key in event.updateDescription.removedFields) {
								if (event.updateDescription.removedFields.hasOwnProperty(key)) {
									diff[key] = undefined;
									unset[key] = 1;
								}
							}
						}

						fn({
							action: 'update',
							clientAction: 'updated',
							id: event.documentKey._id,
							diff,
							unset,
						});

						break;
					case 'delete':
						fn({
							action: 'remove',
							clientAction: 'removed',
							id: event.documentKey._id,
						});
						break;
				}
			});
		});
	}
}
