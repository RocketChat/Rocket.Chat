import {
	dbWatchersDisabled,
	Messages,
	Users,
	Subscriptions,
	Settings,
	LivechatInquiry,
	LivechatDepartmentAgents,
	Rooms,
	Roles,
	LoginServiceConfiguration,
	InstanceStatus,
	IntegrationHistory,
	Integrations,
	EmailInbox,
	PbxEvents,
	Permissions,
	LivechatPriority,
} from './index';

const { DBWATCHER_EXCLUDE_COLLECTIONS = '', DBWATCHER_ONLY_COLLECTIONS = '' } = process.env;

const excludeCollections = DBWATCHER_EXCLUDE_COLLECTIONS.split(',')
	.map((collection) => collection.trim())
	.filter(Boolean);

const onlyCollections = DBWATCHER_ONLY_COLLECTIONS.split(',')
	.map((collection) => collection.trim())
	.filter(Boolean);

export function getWatchCollections(): string[] {
	const collections = [];

	// add back to the list of collections in case db watchers are enabled
	if (!dbWatchersDisabled) {
		collections.push(InstanceStatus.getCollectionName());
		collections.push(Users.getCollectionName());
		collections.push(Messages.getCollectionName());
		collections.push(LivechatInquiry.getCollectionName());
		collections.push(Roles.getCollectionName());
		collections.push(Rooms.getCollectionName());
		collections.push(PbxEvents.getCollectionName());
		collections.push(Integrations.getCollectionName());
		collections.push(Permissions.getCollectionName());
		collections.push(LivechatPriority.getCollectionName());
		collections.push(LoginServiceConfiguration.getCollectionName());
		collections.push(EmailInbox.getCollectionName());
		collections.push(IntegrationHistory.getCollectionName());
		collections.push(Subscriptions.getCollectionName());
		collections.push(Settings.getCollectionName());
		collections.push(LivechatDepartmentAgents.getCollectionName());
	}

	if (onlyCollections.length > 0) {
		return collections.filter((collection) => onlyCollections.includes(collection));
	}

	if (excludeCollections.length > 0) {
		return collections.filter((collection) => !excludeCollections.includes(collection));
	}

	return collections;
}
