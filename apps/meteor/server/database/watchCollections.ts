import {
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
} from '@rocket.chat/models';

const { DBWATCHER_EXCLUDE_COLLECTIONS = '', DBWATCHER_ONLY_COLLECTIONS = '' } = process.env;

export function getWatchCollections(): string[] {
	const excludeCollections = DBWATCHER_EXCLUDE_COLLECTIONS.split(',').map((collection) => collection.trim());
	const onlyCollections = DBWATCHER_ONLY_COLLECTIONS.split(',').map((collection) => collection.trim());

	const collections = [
		Messages.getCollectionName(),
		Users.getCollectionName(),
		Subscriptions.getCollectionName(),
		LivechatInquiry.getCollectionName(),
		LivechatDepartmentAgents.getCollectionName(),
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
		LivechatPriority.getCollectionName(),
	];

	if (onlyCollections.length > 0) {
		return collections.filter((collection) => onlyCollections.includes(collection));
	}

	if (excludeCollections.length > 0) {
		return collections.filter((collection) => !excludeCollections.includes(collection));
	}

	return collections;
}
