import type { UIActionButtonContext } from './UIActionButtonContext';

/** The room kinds an action button can be limited to. */
export enum RoomTypeFilter {
	PUBLIC_CHANNEL = 'public_channel',
	PRIVATE_CHANNEL = 'private_channel',
	PUBLIC_TEAM = 'public_team',
	PRIVATE_TEAM = 'private_team',
	PUBLIC_DISCUSSION = 'public_discussion',
	PRIVATE_DISCUSSION = 'private_discussion',
	DIRECT = 'direct',
	DIRECT_MULTIPLE = 'direct_multiple',
	LIVE_CHAT = 'livechat',
}

/** The places a message action button can appear, beyond the message itself. */
export enum MessageActionContext {
	MESSAGE = 'message',
	MESSAGE_MOBILE = 'message-mobile',
	THREADS = 'threads',
	STARRED = 'starred',
}

/**
 * The conditions under which Rocket.Chat shows an action button.
 *
 * Every condition given has to hold. Omit one and it does not restrict the
 * button. These conditions decide what the user *sees*: check the same things
 * again in the handler, because the button is not the only way to reach it.
 */
export interface IUActionButtonWhen {
	/** Show the button only in rooms of these types. */
	roomTypes?: Array<RoomTypeFilter>;
	/** Show the button only on these message surfaces. */
	messageActionContext?: Array<MessageActionContext>;
	/** Show the button when the user holds at least one of these permissions. */
	hasOnePermission?: Array<string>;
	/** Show the button when the user holds every one of these permissions. */
	hasAllPermissions?: Array<string>;
	/**
	 * Show the button when the user holds at least one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * A role scoped to `Subscriptions` — `owner`, `moderator`, `leader`, or a custom
	 * one — is granted per room, so it matches only on surfaces bound to a room. On a
	 * surface with no room of its own, the user dropdown for instance, only roles
	 * scoped to `Users` match.
	 */
	hasOneRole?: Array<string>;
	/**
	 * Show the button when the user holds every one of these roles.
	 *
	 * Each entry is a role id or a role name. Prefer the name for a custom role,
	 * because its id differs between workspaces.
	 *
	 * A role scoped to `Subscriptions` — `owner`, `moderator`, `leader`, or a custom
	 * one — is granted per room, so it matches only on surfaces bound to a room. On a
	 * surface with no room of its own, the user dropdown for instance, only roles
	 * scoped to `Users` match.
	 */
	hasAllRoles?: Array<string>;
}

/**
 * A button an App adds to the Rocket.Chat UI.
 *
 * Register one from `IUIExtend.registerButton`. When a user presses it the
 * engine calls the App's `IUIKitActionButtonInteractionHandler` with the
 * `actionId` below.
 */
export interface IUIActionButtonDescriptor {
	/** Identifies the button in the interaction handler. Unique within the App. */
	actionId: string;
	/** Where in the UI the button appears. */
	context: UIActionButtonContext;
	/** The i18n key of the button's label. */
	labelI18n: string;
	/** Renders the button as a destructive action. */
	variant?: 'danger';
	/** Restricts who sees the button and where. Always visible when omitted. */
	when?: IUActionButtonWhen;
	/** The group the button is listed under in the UI. */
	category?: 'default' | 'ai';
}
/** A registered {@link IUIActionButtonDescriptor}, tagged with the App that owns it. */
export interface IUIActionButton extends IUIActionButtonDescriptor {
	/** The App the interaction is dispatched to. */
	appId: string;
}
