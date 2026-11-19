import type { ILivechatDepartmentAgents, ILivechatInquiryRecord, ISubscription, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { Collection, Db } from 'mongodb';

import {
	TeamMemberRaw,
	MessagesRaw,
	LivechatInquiryRaw,
	LivechatDepartmentAgentsRaw,
	PermissionsRaw,
	LoginServiceConfigurationRaw,
	InstanceStatusRaw,
	IntegrationHistoryRaw,
	IntegrationsRaw,
	EmailInboxRaw,
	LivechatRoomsRaw,
	LivechatPriorityRaw,
	UploadsRaw,
	LivechatVisitorsRaw,
	RolesRaw,
	RoomsRaw,
	SubscriptionsRaw,
	TeamRaw,
	UsersRaw,
	UsersSessionsRaw,
	AbacAttributesRaw,
	ServerEventsRaw,
	SamlUsedAssertionsRaw,
	CronHistoryRaw,
	VideoConferenceRaw,
} from './modelClasses.js';
import { registerModel } from './proxify.js';

export { getCollectionName } from './getCollectionName.js';

export * from './modelClasses.js';

export * from './dummy/ReadReceipts.js';

export * from './helpers/index.js';

export { registerModel } from './proxify.js';
export * from './proxies.js';
export { type Updater, UpdaterImpl } from './updater.js';
export { readSecondaryPreferred } from './readSecondaryPreferred.js';

export function registerServiceModels(db: Db, trash?: Collection<RocketChatRecordDeleted<any>>): void {
	registerModel('IUsersSessionsModel', () => new UsersSessionsRaw(db));
	registerModel('IUsersModel', () => new UsersRaw(db));

	registerModel('IRolesModel', () => new RolesRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db, trash as Collection<RocketChatRecordDeleted<ISubscription>>));
	registerModel('ITeamModel', () => new TeamRaw(db));
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db));

	registerModel('IMessagesModel', () => new MessagesRaw(db));

	registerModel(
		'ILivechatInquiryModel',
		() => new LivechatInquiryRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>),
	);
	registerModel(
		'ILivechatDepartmentAgentsModel',
		() => new LivechatDepartmentAgentsRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>),
	);

	registerModel('IPermissionsModel', () => new PermissionsRaw(db));
	registerModel('ILoginServiceConfigurationModel', () => new LoginServiceConfigurationRaw(db));
	registerModel('IInstanceStatusModel', () => new InstanceStatusRaw(db));
	registerModel('IIntegrationHistoryModel', () => new IntegrationHistoryRaw(db));
	registerModel('IIntegrationsModel', () => new IntegrationsRaw(db));
	registerModel('IEmailInboxModel', () => new EmailInboxRaw(db));
	registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(db));
	registerModel('ILivechatRoomsModel', () => new LivechatRoomsRaw(db));
	registerModel('IUploadsModel', () => new UploadsRaw(db));
	registerModel('ILivechatVisitorsModel', () => new LivechatVisitorsRaw(db));
	registerModel('IAbacAttributesModel', () => new AbacAttributesRaw(db));
	registerModel('IServerEventsModel', () => new ServerEventsRaw(db));
	// The video-conference stream decides who may follow a call by reading it, and that check runs in whichever
	// process holds the stream — ddp-streamer, once the services are split out.
	registerModel('IVideoConferenceModel', () => new VideoConferenceRaw(db));
	registerModel('ISamlUsedAssertionsModel', () => new SamlUsedAssertionsRaw(db));
	registerModel('ICronHistoryModel', () => new CronHistoryRaw(db));
}
