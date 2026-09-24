import type { IRoom, IUser, IVideoConferenceUser, VideoConferenceCapabilities, VideoConferenceChatAccess } from '@rocket.chat/core-typings';
import type { Badge } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

import type { CallPreferences } from '../hooks/useCallDevicesInitialState';

/**
 * A member of the call, as this window holds them: who they are, and where they stand with the call.
 *
 * Narrower than `IVideoConferenceUser` on purpose — the avatar etag and the `ts` are of no interest to anything
 * rendering a member, and leaving them out keeps the fixtures honest about what the UI actually reads.
 */
export type ConferenceMember = Pick<
	IVideoConferenceUser,
	'_id' | 'username' | 'name' | 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'
>;

/** A panel that can be open beside the call. Only one is, since they share the space. */
export type ConferencePanel = 'members' | 'chat';

/**
 * Which panel is open, and how to change that.
 *
 * Held by the application rather than by the window: a provider that draws its own chat control has to both
 * follow this and drive it, and whatever does that stays mounted while the panel is shut.
 */
export type ConferencePanelState = {
	active?: ConferencePanel;
	toggle: (panel: ConferencePanel) => void;
};

/** Chat access with the members it concerns resolved, since the UI has to name the people it is about. */
export type ConferenceChatAccess = VideoConferenceChatAccess & {
	members: ConferenceMember[];
};

/**
 * Why a read failed, told apart at the only distinction this window acts on.
 *
 * `refused` is an answer about the call — it is gone, or was never this reader's — and the window may finally say
 * so. `unreachable` says nothing about the call at all, and telling someone their call does not exist because a
 * request dropped sends them away from one that is still running.
 *
 * Classified by whoever fetches, so nothing here has to know what a refusal looks like on the wire.
 */
export type ConferenceFailure = {
	kind: 'refused' | 'unreachable';
};

/** The call itself: who is associated with it, what it is called, and what may be done to it. */
export type ConferenceCall = {
	/** Who is associated with the call and where each of them stands — used to tell "still ringing" from "nobody is coming". */
	members: ConferenceMember[];
	/** Only a direct call rang a particular person, so only there does ringing again mean anything. */
	canRing: boolean;
	/** Whether the conference has ended and can no longer be joined. */
	ended: boolean;
	/** What the call is called: its own name if it has one, otherwise the room it belongs to. */
	name: string;
	/** When the conference was created — serves as the timer's start point. */
	createdAt?: Date;
	/** Naming a call is the creator's to do, and only a group call has a name of its own. */
	canRename: boolean;
	/** Which devices the provider can actually be told about, which is all the preflight offers. */
	capabilities: VideoConferenceCapabilities;
	/**
	 * A direct call this user placed whose other side has not been asked to answer yet — entering the call is what
	 * calls them, so the preflight says so rather than pretending they are already ringing.
	 */
	placing: boolean;
};

/** The room the call's chat lives in, and how far along knowing about it has got. */
export type ConferenceRoom = {
	rid?: string;
	/** Given, the call's chat is a thread of the room rather than the room itself. */
	tmid?: string;
	name?: string;
	type?: IRoom['t'];
	loading: boolean;
	error?: ConferenceFailure;
	/** For a read that failed on the way rather than on the way back: there is nothing to do but ask again. */
	retry: () => void;
	chatAccess?: ConferenceChatAccess;
	/**
	 * What the chat button's mark says, already reduced to the one answer the button draws — a count, a dot with
	 * no count behind it, or nothing. Which unread rules a room honours is the product's business, not this
	 * window's.
	 */
	unread: {
		count: number;
		hasUnseenActivity: boolean;
		/** Whatever the product's own badge accepts, since this is drawn as one. */
		variant?: ComponentProps<typeof Badge>['variant'];
		title?: string;
	};
};

/** This window's own standing with the call: whether it holds a session, and what it has to show for one. */
export type ConferenceSession = {
	/** Where the provider runs the call, for a provider that runs it at an address of its own. */
	url?: string;
	/** A provider that runs the call inside Rocket.Chat rather than at a URL of its own — so having no `url` is its answer, not a failure. */
	embedded: boolean;
	/**
	 * Whether *this window* has joined — which is to say, whether it holds a session to render. Deliberately not
	 * "is this user in the call": a reload keeps the membership the server recorded but loses the join it was
	 * built on.
	 */
	joined: boolean;
	loading: boolean;
	error?: ConferenceFailure;
	/** Clears a failed join, which puts the reader back on the preflight with the choice they made intact. */
	retry: () => void;
	/**
	 * Walk into the call without asking first.
	 *
	 * The preflight exists to collect a camera and a microphone. A provider that cannot be told about either has
	 * nothing to collect, so the screen would be a single button between the reader and the call they opened.
	 */
	autoJoin?: boolean;
	/**
	 * The provider draws its own chat control, so this window drops the one in its bar rather than showing two.
	 *
	 * Only true while that control is actually on screen: before the reader connects, and after they drop out,
	 * the provider's toolbar is gone and the window's own button is the only one left.
	 */
	providerOwnsChatToggle?: boolean;
	/** Which side of the call the panels dock to. */
	panelDock?: 'start' | 'end';
};

/**
 * Everything this window can do to the call, as the application does it.
 *
 * Each of these is a round trip somewhere, which is the whole reason they are handed in: a view that knew how to
 * reach the server would be a view that cannot be drawn without one.
 */
export type ConferenceActions = {
	/** Walks into the call with the devices and name the preflight collected. */
	join: (preferences: CallPreferences, name: string, ring: boolean) => void;
	/** Leaves the call and closes the window, reporting whatever this reader's departure amounts to. */
	leave: () => void;
	/** Asks the server to ring one member again. Rejects if it refused, which the row is left to show. */
	ringMember: (memberId: string) => Promise<void>;
	/**
	 * Gives people the call's chat, the one way the reader picked. Rejects if it failed.
	 *
	 * Named nobody, it resolves "some members cannot read the chat" for whoever those members are. Named people,
	 * it brings them into the conversation whether or not anyone was locked out.
	 */
	shareChat: (mode: 'invite' | 'discussion', users?: string[]) => Promise<void>;
	/**
	 * Calls a number or SIP address into the conference.
	 *
	 * Absent for a provider that cannot place one, which is what the modal reads to decide whether to offer it.
	 */
	dialOut?: (destination: string) => void;
	/**
	 * Associates people with the call, which is what lets them join it — deliberately putting them in no room.
	 * Answers how many were actually added, since anyone already associated is skipped and a selection can come
	 * back empty.
	 */
	addParticipants: (users: string[], ring: boolean) => Promise<{ added: number }>;
};

/**
 * Parts of the window that only the application can build, handed in rather than reached for.
 *
 * The chat panel is the product's room — its provider, its message list, its composer — and the member rows show
 * presence, which is a live store this package has no business holding. Both are content in a frame this package
 * owns, so the frame takes them as nodes.
 */
export type ConferenceSlots = {
	/** The call's chat, mounted by the application inside this window's panel. */
	chat?: ReactNode;
	/** This member's presence dot, if the application shows presence at all. */
	renderMemberStatus?: (uid: string) => ReactNode;
	/** The product's own way of picking people, which the add-participants modal is a frame around. */
	renderUserPicker?: (props: UserPickerProps) => ReactNode;
	/** Shown while the window has nothing to say yet, so the wait looks like the rest of the product. */
	loading?: ReactNode;
	/** Shown where the call is not this reader's to see, since the way back into the product is the product's to offer. */
	unauthorized?: ReactNode;
	/**
	 * Shown where the server refused the join itself — a different answer from "you may not see this call", and a
	 * different way out, so the two are not one screen with two titles.
	 */
	joinRefused?: ReactNode;
};

/**
 * Who is looking at this call, and what the workspace and their own preferences have already settled about it.
 *
 * Asked once, where the conference is assembled, rather than by each row that happens to need one: who is logged
 * in, a setting and a permission are all the application's to read, and a component that read them itself could
 * not be rendered without a workspace behind it — which is the whole of what this package is trying not to
 * require.
 */
export type ConferenceViewer = {
	/** Who is reading. `null` where nobody is — the components that ask treat that as "cannot be singled out". */
	uid: IUser['_id'] | null;
	/** Whether people are named by their real name rather than their username. */
	useRealName: boolean;
	/** Whether this reader wants faces at all; with avatars off, counts stand in for them. */
	displayAvatars: boolean;
	/** Whether this workspace lets this caller ring people — the server refuses the ring without it. */
	canRingUsers: boolean;
};

/**
 * What the add-participants modal needs of whatever picker the application hands it.
 *
 * Which names the picker offers is deliberately not asked for: members of the room can already join, so leaving
 * them out is the picker's own business — and knowing who they are means reading the room, which is the
 * application's.
 */
export type UserPickerProps = {
	value: string[];
	onChange: (value: string[]) => void;
	error?: string;
	placeholder: string;
};
