import type { KeyOfEach } from '@rocket.chat/core-typings';

import type { AppsEndpoints } from './apps/index.js';
import type { DefaultEndpoints } from './default/index.js';
import type { ReplacePlaceholders } from './helpers/ReplacePlaceholders.js';
import type { AISearchEndpoints } from './v1/aiSearch.js';
import type { AssetsEndpoints } from './v1/assets.js';
import type { AuthEndpoints } from './v1/auth.js';
import type { AutoTranslateEndpoints } from './v1/autoTranslate.js';
import type { BannersEndpoints } from './v1/banners.js';
import type { CalendarEndpoints } from './v1/calendar/index.js';
import type { ChannelsEndpoints } from './v1/channels/index.js';
import type { ChatEndpoints } from './v1/chat.js';
import type { CloudEndpoints } from './v1/cloud.js';
import type { CommandsEndpoints } from './v1/commands.js';
import type { CustomUserStatusEndpoints } from './v1/customUserStatus.js';
import type { DirectoryEndpoint } from './v1/directory.js';
import type { ImEndpoints, DmEndpoints } from './v1/dm/index.js';
import type { E2eEndpoints } from './v1/e2e.js';
import type { EmailInboxEndpoints } from './v1/email-inbox.js';
import type { EmojiCustomEndpoints } from './v1/emojiCustom.js';
import type { FederationEndpoints } from './v1/federation/index.js';
import type { GroupsEndpoints } from './v1/groups/index.js';
import type { ImportEndpoints } from './v1/import/index.js';
import type { InstancesEndpoints } from './v1/instances.js';
import type { IntegrationHooksEndpoints } from './v1/integrations/hooks/index.js';
import type { IntegrationsEndpoints } from './v1/integrations/index.js';
import type { InvitesEndpoints } from './v1/invites.js';
import type { LDAPEndpoints } from './v1/ldap.js';
import type { LicensesEndpoints } from './v1/licenses.js';
import type { MailerEndpoints } from './v1/mailer.js';
import type { MeEndpoints } from './v1/me.js';
import type { MiscEndpoints } from './v1/misc.js';
import type { ModerationEndpoints } from './v1/moderation/index.js';
import type { OmnichannelEndpoints } from './v1/omnichannel.js';
import type { PresenceEndpoints } from './v1/presence.js';
import type { PushEndpoints } from './v1/push.js';
import type { RolesEndpoints } from './v1/roles.js';
import type { RoomsEndpoints } from './v1/rooms.js';
import type { ServerEventsEndpoints } from './v1/server-events/index.js';
import type { SettingsEndpoints } from './v1/settings.js';
import type { SetupWizardEndpoints } from './v1/setupWizard.js';
import type { StatisticsEndpoints } from './v1/statistics.js';
import type { SubscriptionsEndpoints } from './v1/subscriptionsEndpoints.js';
import type { TeamsEndpoints } from './v1/teams/index.js';
import type { TwoFactorChallengesEndpoints } from './v1/twoFactorChallenges.js';
import type { UsersEndpoints } from './v1/users.js';
import type { VideoConferenceEndpoints } from './v1/videoConference/index.js';

export interface Endpoints
	extends
		AISearchEndpoints,
		ChannelsEndpoints,
		MeEndpoints,
		ModerationEndpoints,
		BannersEndpoints,
		ChatEndpoints,
		CommandsEndpoints,
		CloudEndpoints,
		CommandsEndpoints,
		CustomUserStatusEndpoints,
		DmEndpoints,
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
		SetupWizardEndpoints,
		UsersEndpoints,
		AppsEndpoints,
		OmnichannelEndpoints,
		StatisticsEndpoints,
		LicensesEndpoints,
		MiscEndpoints,
		PresenceEndpoints,
		InstancesEndpoints,
		IntegrationsEndpoints,
		IntegrationHooksEndpoints,
		VideoConferenceEndpoints,
		InvitesEndpoints,
		E2eEndpoints,
		AssetsEndpoints,
		EmailInboxEndpoints,
		MailerEndpoints,
		SubscriptionsEndpoints,
		AutoTranslateEndpoints,
		ImportEndpoints,
		FederationEndpoints,
		CalendarEndpoints,
		AuthEndpoints,
		ImportEndpoints,
		ServerEventsEndpoints,
		TwoFactorChallengesEndpoints,
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
	[
		TOperation in Operations as Parameters<TOperation['fn']> extends { length: 0 }
			? TOperation['method']
			: undefined extends Parameters<TOperation['fn']>[0]
				? TOperation['method']
				: never
	]: TOperation['path'];
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

export * from './apps/index.js';
export type * from './v1/presence.js';
export * from './v1/roles.js';
export * from './v1/settings.js';
export * from './v1/teams/index.js';
export * from './v1/videoConference/index.js';
export * from './v1/assets.js';
export * from './v1/aiSearch.js';
export { abacCreationAttributesSchema } from './v1/abacCreationAttributes.js';
export * from './v1/channels/index.js';
export * from './v1/customSounds.js';
export type * from './v1/customUserStatus.js';
export * from './v1/subscriptionsEndpoints.js';
export type * from './v1/mailer.js';
export * from './v1/me/meSuccessResponse.js';
export * from './v1/mailer/MailerParamsPOST.js';
export * from './v1/mailer/MailerUnsubscribeParamsPOST.js';
export * from './v1/misc.js';
export * from './v1/invites.js';
export * from './v1/dm/index.js';
export * from './v1/dm/DmHistoryProps.js';
export * from './v1/integrations/index.js';
export * from './v1/licenses.js';
export * from './v1/omnichannel.js';
export * from './v1/push.js';
export type * from './helpers/IGetRoomRoles.js';
export type * from './helpers/PaginatedRequest.js';
export type * from './helpers/PaginatedResult.js';
export type * from './helpers/ReplacePlaceholders.js';
export type * from './helpers/WithItemCount.js';
export * from './v1/emojiCustom.js';
export type * from './v1/instances.js';
export * from './v1/ldap.js';
export * from './v1/saml.js';
export * from './v1/users.js';
export * from './v1/users/UsersSetAvatarParamsPOST.js';
export * from './v1/users/UsersSetPreferenceParamsPOST.js';
export * from './v1/users/UsersUpdateOwnBasicInfoParamsPOST.js';
export * from './v1/users/UsersUpdateParamsPOST.js';
export * from './v1/users/UsersCheckUsernameAvailabilityParamsGET.js';
export * from './v1/users/UsersSendConfirmationEmailParamsPOST.js';
export * from './v1/users/UsersGetAvatarParamsGET.js';
export * from './v1/users/UsersPresenceParamsGET.js';
export * from './v1/users/UsersRequestDataDownloadParamsGET.js';
export * from './v1/users/UsersGetPresenceParamsGET.js';
export * from './v1/users/UsersGetStatusParamsGET.js';
export * from './v1/moderation/index.js';
export * from './v1/server-events/index.js';
export * from './v1/statistics.js';

export * from './v1/autotranslate/AutotranslateGetSupportedLanguagesParamsGET.js';
export * from './v1/autotranslate/AutotranslateSaveSettingsParamsPOST.js';
export * from './v1/e2e/e2eSetUserPublicAndPrivateKeysParamsPOST.js';
export * from './v1/e2e.js';
export * from './v1/import/index.js';
export * from './v1/email-inbox.js';
export * from './v1/calendar/index.js';
export type * from './v1/federation/index.js';
export * from './v1/rooms.js';
export * from './v1/groups/index.js';
export * from './v1/chat.js';
export * from './v1/auth.js';
export * from './v1/cloud.js';
export * from './v1/banners.js';
export * from './default/index.js';
export * from './v1/twoFactorChallenges.js';

// Opt-in experimental endpoint typings. Deliberately NOT part of the `Endpoints`
// union above — see ./experimental for the rationale.
export type * from './experimental/index.js';

// Export the ajv instance for use in other packages
export * from './v1/Ajv.js';
export * from './v1/pagination.js';
