import type { ExtractKeys, ValueOf } from '../../../definition/utils';
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

type Endpoints = ChatEndpoints &
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

type Endpoint = UnionizeEndpoints<Endpoints>;

type UnionizeEndpoints<EE extends Endpoints> = ValueOf<
	{
		[P in keyof EE]: UnionizeMethods<P, EE[P]>;
	}
>;

type ExtractOperations<OO, M extends keyof OO> = ExtractKeys<OO, M, (...args: any[]) => any>;

type UnionizeMethods<P, OO> = ValueOf<
	{
		[M in keyof OO as ExtractOperations<OO, M>]: (
			method: M,
			path: P,
			...params: Parameters<Extract<OO[M], (...args: any[]) => any>>
		) => ReturnType<Extract<OO[M], (...args: any[]) => any>>;
	}
>;

export type Method = Parameters<Endpoint>[0];
export type Path = Parameters<Endpoint>[1];

export type MethodFor<P extends Path> = P extends any
	? Parameters<Extract<Endpoint, (method: any, path: P, ...params: any[]) => any>>[0]
	: never;
export type PathFor<M extends Method> = M extends any
	? Parameters<Extract<Endpoint, (method: M, path: any, ...params: any[]) => any>>[1]
	: never;

type Operation<M extends Method, P extends PathFor<M>> = M extends any
	? P extends any
		? Extract<Endpoint, (method: M, path: P, ...params: any[]) => any>
		: never
	: never;

type AssertParams<Q> = Q extends []
	? [undefined?, undefined?]
	: Q extends [any]
	? [Q[0], undefined?]
	: Q extends [...any[]]
	? [Q[0], Q[1]]
	: never;

export type Params<M extends Method, P extends PathFor<M>> = AssertParams<
	[Parameters<Operation<M, P>>[2], Parameters<Operation<M, P>>[3]]
>;
export type Return<M extends Method, P extends PathFor<M>> = ReturnType<Operation<M, P>>;
