import { getConnection } from '../mongo';
import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';
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

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection(15);

		const Trash = db.collection('rocketchat__trash');

		const Rooms = new RoomsRaw(db, Trash);
		const Settings = new SettingsRaw(db);
		const Users = new UsersRaw(db, Trash);
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
			PbxEvents,
		};

		initWatchers(models, api.broadcast.bind(api), (model, fn) => {
			model.watch([]).on('change', (event) => {
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
