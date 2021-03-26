import { FollowMessageEndpoint as ChatFollowMessageEndpoint } from './endpoints/v1/chat/followMessage';
import { GetMessageEndpoint as ChatGetMessageEndpoint } from './endpoints/v1/chat/getMessage';
import { UnfollowMessageEndpoint as ChatUnfollowMessageEndpoint } from './endpoints/v1/chat/unfollowMessage';
import { AutocompleteEndpoint as UsersAutocompleteEndpoint } from './endpoints/v1/users/autocomplete';
import { AutocompleteChannelAndPrivateEndpoint as RoomsAutocompleteEndpoint } from './endpoints/v1/rooms/autocompleteChannelAndPrivate';
import { AppearanceEndpoint as LivechatAppearanceEndpoint } from './endpoints/v1/livechat/appearance';
import { ListEndpoint as CustomUserStatusListEndpoint } from './endpoints/v1/custom-user-status/list';
import { ExternalComponentsEndpoint as AppsExternalComponentsEndpoint } from './endpoints/apps/externalComponents';
import { ManualRegisterEndpoint as CloudManualRegisterEndpoint } from './endpoints/v1/cloud/manualRegister';
import { FilesEndpoint as GroupsFilesEndpoint } from './endpoints/v1/groups/files';
import { FilesEndpoint as ImFilesEndpoint } from './endpoints/v1/im/files';
import { AddRoomsEndpoint as TeamsAddRoomsEndpoint } from './endpoints/v1/teams/addRooms';
import { FilesEndpoint as ChannelsFilesEndpoint } from './endpoints/v1/channels/files';
import { ListEndpoint as EmojiCustomListEndpoint } from './endpoints/v1/emoji-custom/list';
import { GetDiscussionsEndpoint as ChatGetDiscussionsEndpoint } from './endpoints/v1/chat/getDiscussions';
import { GetThreadsListEndpoint as ChatGetThreadsListEndpoint } from './endpoints/v1/chat/getThreadsList';
import { LivechatVisitorInfoEndpoint } from './endpoints/v1/livechat/visitorInfo';

export type ServerEndpoints = {
	'chat.getMessage': ChatGetMessageEndpoint;
	'chat.followMessage': ChatFollowMessageEndpoint;
	'chat.unfollowMessage': ChatUnfollowMessageEndpoint;
	'cloud.manualRegister': CloudManualRegisterEndpoint;
	'chat.getDiscussions': ChatGetDiscussionsEndpoint;
	'chat.getThreadsList': ChatGetThreadsListEndpoint;
	'emoji-custom.list': EmojiCustomListEndpoint;
	'channels.files': ChannelsFilesEndpoint;
	'im.files': ImFilesEndpoint;
	'groups.files': GroupsFilesEndpoint;
	'users.autocomplete': UsersAutocompleteEndpoint;
	'livechat/appearance': LivechatAppearanceEndpoint;
	'custom-user-status.list': CustomUserStatusListEndpoint;
	'/apps/externalComponents': AppsExternalComponentsEndpoint;
	'rooms.autocomplete.channelAndPrivate': RoomsAutocompleteEndpoint;
	'teams.addRooms': TeamsAddRoomsEndpoint;
	'livechat/visitors.info': LivechatVisitorInfoEndpoint;
};

export type ServerEndpointPath = keyof ServerEndpoints;
export type ServerEndpointMethodOf<Path extends ServerEndpointPath> = keyof ServerEndpoints[Path] & ('GET' | 'POST' | 'DELETE');

type ServerEndpoint<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath
> = ServerEndpoints[Path][Method] extends (...args: any[]) => any
	? ServerEndpoints[Path][Method]
	: (...args: any[]) => any;

export type ServerEndpointRequestPayload<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath
> = Parameters<ServerEndpoint<Method, Path>>[0];

export type ServerEndpointFormData<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath
> = Parameters<ServerEndpoint<Method, Path>>[1];

export type ServerEndpointResponsePayload<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath
> = ReturnType<ServerEndpoint<Method, Path>>;

export type ServerEndpointFunction<
	Method extends ServerEndpointMethodOf<Path>,
	Path extends ServerEndpointPath
> = {
	(params: ServerEndpointRequestPayload<Method, Path>): Promise<ServerEndpointResponsePayload<Method, Path>>;
	(params: ServerEndpointRequestPayload<Method, Path>, formData: ServerEndpointFormData<Method, Path>): Promise<ServerEndpointResponsePayload<Method, Path>>;
};
