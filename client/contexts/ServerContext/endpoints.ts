import type { FromApi } from '../../../definition/FromApi';
import type { EngagementDashboardEndpoints } from '../../../ee/client/contexts/ServerContext/endpoints/v1/engagementDashboard';
import type { AppsEndpoints } from './endpoints/apps';
import type { ChannelsEndpoints } from './endpoints/v1/channels';
import type { ChatEndpoints } from './endpoints/v1/chat';
import type { CloudEndpoints } from './endpoints/v1/cloud';
import type { CustomUserStatusEndpoints } from './endpoints/v1/customUserStatus';
import type { DnsEndpoints } from './endpoints/v1/dns';
import type { EmojiCustomEndpoints } from './endpoints/v1/emojiCustom';
import type { GroupsEndpoints } from './endpoints/v1/groups';
import type { ImEndpoints } from './endpoints/v1/im';
import type { OmnichannelEndpoints } from './endpoints/v1/omnichannel';
import type { RoomsEndpoints } from './endpoints/v1/rooms';
import type { TeamsEndpoints } from './endpoints/v1/teams';
import type { UsersEndpoints } from './endpoints/v1/users';

export type ServerEndpoints = ChatEndpoints &
	ChannelsEndpoints &
	CloudEndpoints &
	CustomUserStatusEndpoints &
	DnsEndpoints &
	EmojiCustomEndpoints &
	GroupsEndpoints &
	ImEndpoints &
	RoomsEndpoints &
	TeamsEndpoints &
	UsersEndpoints &
	EngagementDashboardEndpoints &
	AppsEndpoints &
	OmnichannelEndpoints;

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
> = FromApi<ReturnType<ServerEndpoint<Method, Path>>>;

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
