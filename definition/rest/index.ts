import type { EnterpriseEndpoints } from '../../ee/definition/rest';
import type { ExtractKeys, ValueOf } from '../utils';
import type { AppsEndpoints } from './apps';
import type { ChannelsEndpoints } from './v1/channels';
import type { ChatEndpoints } from './v1/chat';
import type { CloudEndpoints } from './v1/cloud';
import type { CustomUserStatusEndpoints } from './v1/customUserStatus';
import type { DmEndpoints } from './v1/dm';
import type { DnsEndpoints } from './v1/dns';
import type { EmojiCustomEndpoints } from './v1/emojiCustom';
import type { GroupsEndpoints } from './v1/groups';
import type { ImEndpoints } from './v1/im';
import type { LDAPEndpoints } from './v1/ldap';
import type { LicensesEndpoints } from './v1/licenses';
import type { MiscEndpoints } from './v1/misc';
import type { OmnichannelEndpoints } from './v1/omnichannel';
import type { RoomsEndpoints } from './v1/rooms';
import type { StatisticsEndpoints } from './v1/statistics';
import type { TeamsEndpoints } from './v1/teams';
import type { UsersEndpoints } from './v1/users';

type CommunityEndpoints = ChatEndpoints &
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
	TeamsEndpoints &
	UsersEndpoints &
	AppsEndpoints &
	OmnichannelEndpoints &
	StatisticsEndpoints &
	LicensesEndpoints &
	MiscEndpoints;

type Endpoints = CommunityEndpoints & EnterpriseEndpoints;

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
			path: OO extends { path: string } ? OO['path'] : P,
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

type ExtractParams<Q> = Q extends [any, any]
	? [undefined?]
	: Q extends [any, any, any, ...any[]]
	? [Q[2]]
	: never;

export type Params<M extends Method, P extends PathFor<M>> = ExtractParams<
	Parameters<Operation<M, P>>
>;
export type Return<M extends Method, P extends PathFor<M>> = ReturnType<Operation<M, P>>;
