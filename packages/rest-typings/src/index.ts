// import type { EnterpriseEndpoints } from "@rocket.chat/core-typings";
import type { KeyOfEach } from '@rocket.chat/core-typings';

import type { AppsEndpoints } from './apps';
import type { DefaultEndpoints } from './default';
import type { ReplacePlaceholders } from './helpers/ReplacePlaceholders';
import type { AssetsEndpoints } from './v1/assets';
import type { AuthEndpoints } from './v1/auth';
import type { AutoTranslateEndpoints } from './v1/autoTranslate';
import type { BannersEndpoints } from './v1/banners';
import type { CalendarEndpoints } from './v1/calendar';
import type { ChannelsEndpoints } from './v1/channels';
import type { ChatEndpoints } from './v1/chat';
import type { CloudEndpoints } from './v1/cloud';
import type { CommandsEndpoints } from './v1/commands';
import type { CustomSoundEndpoint } from './v1/customSounds';
import type { CustomUserStatusEndpoints } from './v1/customUserStatus';
import type { DirectoryEndpoint } from './v1/directory';
import type { ImEndpoints, DmEndpoints } from './v1/dm';
import type { DnsEndpoints } from './v1/dns';
import type { E2eEndpoints } from './v1/e2e';
import type { EmailInboxEndpoints } from './v1/email-inbox';
import type { EmojiCustomEndpoints } from './v1/emojiCustom';
import type { FederationEndpoints } from './v1/federation';
import type { GroupsEndpoints } from './v1/groups';
import type { ImportEndpoints } from './v1/import';
import type { InstancesEndpoints } from './v1/instances';
import type { IntegrationsEndpoints } from './v1/integrations';
import type { InvitesEndpoints } from './v1/invites';
import type { LDAPEndpoints } from './v1/ldap';
import type { LicensesEndpoints } from './v1/licenses';
import type { MailerEndpoints } from './v1/mailer';
import type { MeEndpoints } from './v1/me';
import type { MiscEndpoints } from './v1/misc';
import type { ModerationEndpoints } from './v1/moderation';
import type { OAuthAppsEndpoint } from './v1/oauthapps';
import type { OmnichannelEndpoints } from './v1/omnichannel';
import type { PermissionsEndpoints } from './v1/permissions';
import type { PresenceEndpoints } from './v1/presence';
import type { PushEndpoints } from './v1/push';
import type { RolesEndpoints } from './v1/roles';
import type { RoomsEndpoints } from './v1/rooms';
import type { SettingsEndpoints } from './v1/settings';
import type { StatisticsEndpoints } from './v1/statistics';
import type { SubscriptionsEndpoints } from './v1/subscriptionsEndpoints';
import type { TeamsEndpoints } from './v1/teams';
import type { UsersEndpoints } from './v1/users';
import type { VideoConferenceEndpoints } from './v1/videoConference';
import type { VoipEndpoints } from './v1/voip';
import type { VoipFreeSwitchEndpoints } from './v1/voip-freeswitch';
import type { WebdavEndpoints } from './v1/webdav';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Endpoints
	extends ChannelsEndpoints,
		MeEndpoints,
		ModerationEndpoints,
		BannersEndpoints,
		ChatEndpoints,
		CommandsEndpoints,
		CloudEndpoints,
		CommandsEndpoints,
		CustomUserStatusEndpoints,
		DmEndpoints,
		DnsEndpoints,
		DirectoryEndpoint,
		EmojiCustomEndpoints,
		GroupsEndpoints,
		ImEndpoints,
		LDAPEndpoints,
		RoomsEndpoints,
		PushEndpoints,
		RolesEndpoints,
		TeamsEndpoints,
		SettingsEndpoints,
		UsersEndpoints,
		AppsEndpoints,
		OmnichannelEndpoints,
		StatisticsEndpoints,
		LicensesEndpoints,
		MiscEndpoints,
		PermissionsEndpoints,
		PresenceEndpoints,
		InstancesEndpoints,
		IntegrationsEndpoints,
		VoipEndpoints,
		VideoConferenceEndpoints,
		InvitesEndpoints,
		E2eEndpoints,
		AssetsEndpoints,
		CustomSoundEndpoint,
		EmailInboxEndpoints,
		MailerEndpoints,
		WebdavEndpoints,
		OAuthAppsEndpoint,
		SubscriptionsEndpoints,
		AutoTranslateEndpoints,
		ImportEndpoints,
		FederationEndpoints,
		CalendarEndpoints,
		AuthEndpoints,
		ImportEndpoints,
		VoipFreeSwitchEndpoints,
		DefaultEndpoints {}

type OperationsByPathPatternAndMethod<
	TEndpoints extends Endpoints,
	TPathPattern extends keyof TEndpoints,
	TMethod extends KeyOfEach<TEndpoints[TPathPattern]> = KeyOfEach<TEndpoints[TPathPattern]>,
> = TMethod extends any
	? {
			pathPattern: TPathPattern;
			method: TMethod;
			fn: TEndpoints[TPathPattern][TMethod];
			path: ReplacePlaceholders<TPathPattern extends string ? TPathPattern : never>;
			params: GetParams<TEndpoints[TPathPattern][TMethod]>;
			result: GetResult<TEndpoints[TPathPattern][TMethod]>;
		}
	: never;

type OperationsByPathPattern<TEndpoints extends Endpoints, TPathPattern extends keyof TEndpoints> = TPathPattern extends any
	? OperationsByPathPatternAndMethod<TEndpoints, TPathPattern>
	: never;

type Operations = OperationsByPathPattern<Endpoints, keyof Endpoints>;

export type PathPattern = Operations['pathPattern'];

export type Method = Operations['method'];

export type Path = Operations['path'];

type MethodToPathMap = {
	[TOperation in Operations as TOperation['method']]: TOperation['path'];
};

type MethodToPathWithParamsMap = {
	[TOperation in Operations as Parameters<TOperation['fn']> extends { length: 0 } ? never : TOperation['method']]: TOperation['path'];
};

type MethodToPathWithoutParamsMap = {
	[TOperation in Operations as Parameters<TOperation['fn']> extends { length: 0 }
		? TOperation['method']
		: undefined extends Parameters<TOperation['fn']>[0]
			? TOperation['method']
			: never]: TOperation['path'];
};

export type PathFor<TMethod extends Method> = MethodToPathMap[TMethod];

export type PathWithParamsFor<TMethod extends Method> = MethodToPathWithParamsMap[TMethod extends keyof MethodToPathWithParamsMap
	? TMethod
	: never];

export type PathWithoutParamsFor<TMethod extends Method> = MethodToPathWithoutParamsMap[TMethod extends keyof MethodToPathWithoutParamsMap
	? TMethod
	: never];

type MethodToPathPatternToParamsMap = {
	[TMethod in Method]: {
		[TPathPattern in keyof Endpoints]: TMethod extends keyof Endpoints[TPathPattern]
			? Endpoints[TPathPattern][TMethod] extends infer TOperation
				? TOperation extends (...args: any) => any
					? Parameters<TOperation>[0]
					: never
				: never
			: never;
	};
};

type MethodToPathPatternToResultMap = {
	[TMethod in Method]: {
		[TPathPattern in keyof Endpoints]: TMethod extends keyof Endpoints[TPathPattern]
			? Endpoints[TPathPattern][TMethod] extends infer TOperation
				? TOperation extends (...args: any) => any
					? ReturnType<TOperation>
					: never
				: never
			: never;
	};
};

export type ParamsFor<TMethod extends Method, TPathPattern extends PathPattern> = MethodToPathPatternToParamsMap[TMethod][TPathPattern];

export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> = MethodToPathPatternToResultMap[TMethod][TPathPattern];

export type MatchPathPattern<TPath extends Path> = TPath extends any ? Extract<Operations, { path: TPath }>['pathPattern'] : never;

export type JoinPathPattern<TBasePath extends string, TSubPathPattern extends string> = Extract<
	PathPattern,
	`${TBasePath}${TSubPathPattern extends '' ? TSubPathPattern : `/${TSubPathPattern}`}` | TSubPathPattern
>;

type GetParams<TOperation> = TOperation extends (...args: any) => any ? Parameters<TOperation>[0] : never;

type GetResult<TOperation> = TOperation extends (...args: any) => any ? ReturnType<TOperation> : never;

export type OperationParams<TMethod extends Method, TPathPattern extends PathPattern> = TMethod extends keyof Endpoints[TPathPattern]
	? GetParams<Endpoints[TPathPattern][TMethod]>
	: never;

export type OperationResult<TMethod extends Method, TPathPattern extends PathPattern> = TMethod extends keyof Endpoints[TPathPattern]
	? GetResult<Endpoints[TPathPattern][TMethod]>
	: never;

export type UrlParams<T extends string> = string extends T
	? Record<string, string>
	: T extends `${string}:${infer Param}/${infer Rest}`
		? { [k in Param | keyof UrlParams<Rest>]: string }
		: T extends `${string}:${infer Param}`
			? { [k in Param]: string }
			: undefined | Record<string, never>;

export type MethodOf<TPathPattern extends PathPattern> = TPathPattern extends any ? keyof Endpoints[TPathPattern] : never;

export * from './v1/permissions';
export * from './v1/presence';
export * from './v1/roles';
export * from './v1/settings';
export * from './v1/teams';
export * from './v1/videoConference';
export * from './v1/assets';
export * from './v1/channels';
export * from './v1/customUserStatus';
export * from './v1/customSounds';
export * from './v1/subscriptionsEndpoints';
export * from './v1/mailer';
export * from './v1/mailer/MailerParamsPOST';
export * from './v1/mailer/MailerUnsubscribeParamsPOST';
export * from './v1/misc';
export * from './v1/invites';
export * from './v1/dm';
export * from './v1/dm/DmHistoryProps';
export * from './v1/integrations';
export * from './v1/licenses';
export * from './v1/omnichannel';
export * from './v1/oauthapps';
export * from './v1/oauthapps/UpdateOAuthAppParamsPOST';
export * from './v1/oauthapps/OAuthAppsGetParamsGET';
export * from './v1/oauthapps/OAuthAppsAddParamsPOST';
export * from './v1/oauthapps/DeleteOAuthAppParamsDELETE';
export * from './helpers/PaginatedRequest';
export * from './helpers/PaginatedResult';
export * from './helpers/ReplacePlaceholders';
export * from './helpers/WithItemCount';
export * from './v1/emojiCustom';
export * from './v1/instances';
export * from './v1/users';
export * from './v1/users/UsersSetAvatarParamsPOST';
export * from './v1/users/UsersSetPreferenceParamsPOST';
export * from './v1/users/UsersUpdateOwnBasicInfoParamsPOST';
export * from './v1/users/UsersUpdateParamsPOST';
export * from './v1/users/UsersCheckUsernameAvailabilityParamsGET';
export * from './v1/users/UsersSendConfirmationEmailParamsPOST';
export * from './v1/moderation';

export * from './v1/autotranslate/AutotranslateGetSupportedLanguagesParamsGET';
export * from './v1/autotranslate/AutotranslateSaveSettingsParamsPOST';
export * from './v1/autotranslate/AutotranslateTranslateMessageParamsPOST';
export * from './v1/e2e/e2eGetUsersOfRoomWithoutKeyParamsGET';
export * from './v1/e2e/e2eSetRoomKeyIDParamsPOST';
export * from './v1/e2e/e2eSetUserPublicAndPrivateKeysParamsPOST';
export * from './v1/e2e/e2eUpdateGroupKeyParamsPOST';
export * from './v1/e2e';
export * from './v1/import';
export * from './v1/voip';
export * from './v1/voip-freeswitch';
export * from './v1/email-inbox';
export * from './v1/calendar';
export * from './v1/federation';
export * from './v1/rooms';
export * from './v1/groups';
export * from './v1/chat';
export * from './v1/auth';
export * from './v1/cloud';
export * from './v1/banners';
