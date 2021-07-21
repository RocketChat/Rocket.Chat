import { EngagementDashboardActiveUsersEndpoint } from '../../../ee/app/engagement-dashboard/client/contexts/ServerContext/endpoints/EngagementDashboardActiveUsers';
import { ExternalComponentsEndpoint as AppsExternalComponentsEndpoint } from './endpoints/apps/externalComponents';
import { FilesEndpoint as ChannelsFilesEndpoint } from './endpoints/v1/channels/files';
import { ChannelsMembersEndpoint } from './endpoints/v1/channels/members';
import { FollowMessageEndpoint as ChatFollowMessageEndpoint } from './endpoints/v1/chat/followMessage';
import { GetDiscussionsEndpoint as ChatGetDiscussionsEndpoint } from './endpoints/v1/chat/getDiscussions';
import { GetMessageEndpoint as ChatGetMessageEndpoint } from './endpoints/v1/chat/getMessage';
import { GetThreadsListEndpoint as ChatGetThreadsListEndpoint } from './endpoints/v1/chat/getThreadsList';
import { UnfollowMessageEndpoint as ChatUnfollowMessageEndpoint } from './endpoints/v1/chat/unfollowMessage';
import { ManualRegisterEndpoint as CloudManualRegisterEndpoint } from './endpoints/v1/cloud/manualRegister';
import { ListEndpoint as CustomUserStatusListEndpoint } from './endpoints/v1/custom-user-status/list';
import { ResolveSrvEndpoint } from './endpoints/v1/dns/resolve.srv';
import { ResolveTxtEndpoint } from './endpoints/v1/dns/resolve.txt';
import { ListEndpoint as EmojiCustomListEndpoint } from './endpoints/v1/emoji-custom/list';
import { FilesEndpoint as GroupsFilesEndpoint } from './endpoints/v1/groups/files';
import { GroupsMembersEndpoint } from './endpoints/v1/groups/members';
import { FilesEndpoint as ImFilesEndpoint } from './endpoints/v1/im/files';
import { ImMembersEndpoint } from './endpoints/v1/im/members';
import { AppearanceEndpoint as LivechatAppearanceEndpoint } from './endpoints/v1/livechat/appearance';
import { LivechatCustomFieldsEndpoint } from './endpoints/v1/livechat/customFields';
import { LivechatDepartment } from './endpoints/v1/livechat/department';
import { LivechatDepartmentsByUnit } from './endpoints/v1/livechat/departmentsByUnit';
import { LivechatMonitorsList } from './endpoints/v1/livechat/monitorsList';
import { LivechatRoomOnHoldEndpoint } from './endpoints/v1/livechat/onHold';
import { LivechatRoomsEndpoint } from './endpoints/v1/livechat/rooms';
import { LivechatTagsList } from './endpoints/v1/livechat/tagsList';
import { LivechatUsersAgentEndpoint } from './endpoints/v1/livechat/usersAgent';
import { LivechatVisitorInfoEndpoint } from './endpoints/v1/livechat/visitorInfo';
import { CannedResponsesEndpoint } from './endpoints/v1/omnichannel/cannedResponses';
import { AutocompleteAvailableForTeamsEndpoint as RoomsAutocompleteTeamsEndpoint } from './endpoints/v1/rooms/autocompleteAvailableForTeams';
import { AutocompleteChannelAndPrivateEndpoint as RoomsAutocompleteEndpoint } from './endpoints/v1/rooms/autocompleteChannelAndPrivate';
import { RoomsInfo as RoomsInfoEndpoint } from './endpoints/v1/rooms/roomsInfo';
import { AddRoomsEndpoint as TeamsAddRoomsEndpoint } from './endpoints/v1/teams/addRooms';
import { ListRoomsEndpoint } from './endpoints/v1/teams/listRooms';
import { ListRoomsOfUserEndpoint } from './endpoints/v1/teams/listRoomsOfUser';
import { AutocompleteEndpoint as UsersAutocompleteEndpoint } from './endpoints/v1/users/autocomplete';
import { SendEmailCodeEndpoint } from './endpoints/v1/users/twoFactorAuth/sendEmailCode';

export type ServerEndpoints = {
	'chat.getMessage': ChatGetMessageEndpoint;
	'chat.followMessage': ChatFollowMessageEndpoint;
	'chat.unfollowMessage': ChatUnfollowMessageEndpoint;
	'cloud.manualRegister': CloudManualRegisterEndpoint;
	'chat.getDiscussions': ChatGetDiscussionsEndpoint;
	'chat.getThreadsList': ChatGetThreadsListEndpoint;
	'dns.resolve.srv': ResolveSrvEndpoint;
	'dns.resolve.txt': ResolveTxtEndpoint;
	'emoji-custom.list': EmojiCustomListEndpoint;
	'channels.files': ChannelsFilesEndpoint;
	'im.files': ImFilesEndpoint;
	'im.members': ImMembersEndpoint;
	'groups.files': GroupsFilesEndpoint;
	'groups.members': GroupsMembersEndpoint;
	'channels.members': ChannelsMembersEndpoint;
	'users.autocomplete': UsersAutocompleteEndpoint;
	'livechat/appearance': LivechatAppearanceEndpoint;
	'custom-user-status.list': CustomUserStatusListEndpoint;
	'/apps/externalComponents': AppsExternalComponentsEndpoint;
	'rooms.autocomplete.channelAndPrivate': RoomsAutocompleteEndpoint;
	'rooms.autocomplete.availableForTeams': RoomsAutocompleteTeamsEndpoint;
	'teams.listRooms': ListRoomsEndpoint;
	'teams.listRoomsOfUser': ListRoomsOfUserEndpoint;
	'teams.addRooms': TeamsAddRoomsEndpoint;
	'livechat/visitors.info': LivechatVisitorInfoEndpoint;
	'livechat/room.onHold': LivechatRoomOnHoldEndpoint;
	'livechat/monitors.list': LivechatMonitorsList;
	'livechat/tags.list': LivechatTagsList;
	'livechat/department': LivechatDepartment;
	'livechat/departments.by-unit/': LivechatDepartmentsByUnit;
	'engagement-dashboard/users/active-users': EngagementDashboardActiveUsersEndpoint;
	'rooms.info': RoomsInfoEndpoint;
	'users.2fa.sendEmailCode': SendEmailCodeEndpoint;
	'livechat/custom-fields': LivechatCustomFieldsEndpoint;
	'livechat/rooms': LivechatRoomsEndpoint;
	'livechat/users/agent': LivechatUsersAgentEndpoint;
	'canned-responses': CannedResponsesEndpoint;
};

export type ServerEndpointPath = keyof ServerEndpoints;
export type ServerEndpointMethodOf<Path extends ServerEndpointPath> = keyof ServerEndpoints[Path] &
	('GET' | 'POST' | 'DELETE');

type ServerEndpoint<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
> = ServerEndpoints[Path][Method] extends (...args: any[]) => any
	? ServerEndpoints[Path][Method]
	: (...args: any[]) => any;

export type ServerEndpointRequestPayload<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
> = Parameters<ServerEndpoint<Method, Path>>[0];

export type ServerEndpointFormData<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
> = Parameters<ServerEndpoint<Method, Path>>[1];

export type ServerEndpointResponsePayload<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
> = ReturnType<ServerEndpoint<Method, Path>>;

export type ServerEndpointFunction<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath,
> = {
	(params: ServerEndpointRequestPayload<Method, Path>): Promise<
		ServerEndpointResponsePayload<Method, Path>
	>;
	(
		params: ServerEndpointRequestPayload<Method, Path>,
		formData: ServerEndpointFormData<Method, Path>,
	): Promise<ServerEndpointResponsePayload<Method, Path>>;
};
