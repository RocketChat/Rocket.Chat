import {
	Messages,
	Users,
	Subscriptions,
	Settings,
	LivechatInquiry,
	LivechatDepartmentAgents,
	Rooms,
	UsersSessions,
	Roles,
	LoginServiceConfiguration,
	InstanceStatus,
	IntegrationHistory,
	Integrations,
	EmailInbox,
	PbxEvents,
	Permissions,
} from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';

import { DatabaseWatcher } from '../database/DatabaseWatcher';
import { db } from '../database/utils';
import { isRunningMs } from '../lib/isRunningMs';
import { initWatchers } from '../modules/watchers/watchers.module';
import { api } from '../sdk/api';

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

if (!isRunningMs()) {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

	const watcher = new DatabaseWatcher(db, watchCollections, (mongo as any)._oplogHandle);

	initWatchers(watcher, api.broadcastLocal.bind(api));

	watcher.watch();
}
