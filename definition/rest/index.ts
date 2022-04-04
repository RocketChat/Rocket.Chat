import type { EnterpriseEndpoints } from '../../ee/definition/rest';
import type { KeyOfEach } from '../utils';
import type { AppsEndpoints } from './apps';
import type { ReplacePlaceholders } from './helpers/ReplacePlaceholders';
import type { BannersEndpoints } from './v1/banners';
import type { ChannelsEndpoints } from './v1/channels';
import type { ChatEndpoints } from './v1/chat';
import type { CloudEndpoints } from './v1/cloud';
import type { CustomUserStatusEndpoints } from './v1/customUserStatus';
import type { DmEndpoints } from './v1/dm';
import type { DnsEndpoints } from './v1/dns';
import { E2eEndpoints } from './v1/e2e';
import type { EmojiCustomEndpoints } from './v1/emojiCustom';
import type { GroupsEndpoints } from './v1/groups';
import type { ImEndpoints } from './v1/im';
import type { InstancesEndpoints } from './v1/instances';
import type { InvitesEndpoints } from './v1/invites';
import type { LDAPEndpoints } from './v1/ldap';
import type { LicensesEndpoints } from './v1/licenses';
import type { MiscEndpoints } from './v1/misc';
import type { OmnichannelEndpoints } from './v1/omnichannel';
import type { PermissionsEndpoints } from './v1/permissions';
import type { RolesEndpoints } from './v1/roles';
import type { RoomsEndpoints } from './v1/rooms';
import type { SettingsEndpoints } from './v1/settings';
import type { StatisticsEndpoints } from './v1/statistics';
import type { TeamsEndpoints } from './v1/teams';
import type { UsersEndpoints } from './v1/users';
import type { VoipEndpoints } from './v1/voip';

type CommunityEndpoints = BannersEndpoints &
	ChatEndpoints &
	ChannelsEndpoints &
	CloudEndpoints &
	CustomUserStatusEndpoints &
	DmEndpoints &
	DnsEndpoints &
	EmojiCustomEndpoints &
	GroupsEndpoints &
	ImEndpoints &
	LDAPEndpoints &
	RoomsEndpoints &
	RolesEndpoints &
	TeamsEndpoints &
	SettingsEndpoints &
	UsersEndpoints &
	AppsEndpoints &
	OmnichannelEndpoints &
	StatisticsEndpoints &
	LicensesEndpoints &
	MiscEndpoints &
	PermissionsEndpoints &
	InstancesEndpoints &
	VoipEndpoints &
	InvitesEndpoints &
	E2eEndpoints;

type Endpoints = CommunityEndpoints & EnterpriseEndpoints;

type OperationsByPathPattern<TPathPattern extends keyof Endpoints> = TPathPattern extends any
	? OperationsByPathPatternAndMethod<TPathPattern>
	: never;

type OperationsByPathPatternAndMethod<
	TPathPattern extends keyof Endpoints,
	TMethod extends KeyOfEach<Endpoints[TPathPattern]> = KeyOfEach<Endpoints[TPathPattern]>,
> = TMethod extends any
	? {
			pathPattern: TPathPattern;
			method: TMethod;
			path: ReplacePlaceholders<TPathPattern>;
			params: GetParams<Endpoints[TPathPattern][TMethod]>;
			result: GetResult<Endpoints[TPathPattern][TMethod]>;
	  }
	: never;

type Operations = OperationsByPathPattern<keyof Endpoints>;

export type PathPattern = Operations['pathPattern'];

export type Method = Operations['method'];

export type Path = Operations['path'];

export type MethodFor<TPath extends Path> = TPath extends any ? Extract<Operations, { path: TPath }>['method'] : never;

export type PathFor<TMethod extends Method> = TMethod extends any ? Extract<Operations, { method: TMethod }>['path'] : never;

export type MatchPathPattern<TPath extends Path> = TPath extends any ? Extract<Operations, { path: TPath }>['pathPattern'] : never;

export type JoinPathPattern<TBasePath extends string, TSubPathPattern extends string> = Extract<
	PathPattern,
	`${TBasePath}/${TSubPathPattern}` | TSubPathPattern
>;

type GetParams<TOperation> = TOperation extends (...args: any) => any
	? Parameters<TOperation>[0] extends void
		? void
		: Parameters<TOperation>[0]
	: never;

type GetResult<TOperation> = TOperation extends (...args: any) => any ? ReturnType<TOperation> : never;

export type OperationParams<TMethod extends Method, TPathPattern extends PathPattern> = TMethod extends keyof Endpoints[TPathPattern]
	? GetParams<Endpoints[TPathPattern][TMethod]>
	: never;

export type OperationResult<TMethod extends Method, TPathPattern extends PathPattern> = TMethod extends keyof Endpoints[TPathPattern]
	? GetResult<Endpoints[TPathPattern][TMethod]>
	: never;

export type UrlParams<T extends string> = string extends T
	? Record<string, string>
	: T extends `${infer _Start}:${infer Param}/${infer Rest}`
	? { [k in Param | keyof UrlParams<Rest>]: string }
	: T extends `${infer _Start}:${infer Param}`
	? { [k in Param]: string }
	: {};

export type MethodOf<TPathPattern extends PathPattern> = TPathPattern extends any ? keyof Endpoints[TPathPattern] : never;
