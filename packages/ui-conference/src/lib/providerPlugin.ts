/**
 * The contract a provider's in-page plugin speaks, as the views that read it need it.
 *
 * Kept beside the views rather than beside the hook that parses the wire, because these are the shapes the
 * member rows and their controls are written against: what the provider says about a call, and what it can be
 * asked to do about it. Who sends which message, and what each one means, is the application's to honour.
 */

/** Everything a plugin may name in `ready`. A feature absent from that list is one the window never asks for. */
export const PLUGIN_FEATURES = [
	'chat',
	'participants',
	'roster',
	'self',
	'mute',
	'mute-video',
	'admit',
	'disconnect',
	'spotlight',
	'raise-hand',
	'set-role',
	'transfer',
	'dtmf',
	'mute-all-guests',
] as const;

export type PluginFeature = (typeof PLUGIN_FEATURES)[number];

/**
 * What the provider lets this participant's own controls do, straight from its per-participant flags.
 *
 * A control this refuses is a request that comes back 403, so these decide what is offered rather than what
 * happens when it is pressed.
 */
export type PluginParticipantPermissions = {
	control: boolean;
	mute: boolean;
	disconnect: boolean;
	transfer: boolean;
	spotlight: boolean;
	fecc: boolean;
	raiseHand: boolean;
	changeLayout: boolean;
};

/** Someone the provider has in the call, as its plugin reports them. */
export type PluginParticipant = {
	uuid: string;
	/** The only identity the protocol carries — no id is passed, and none is broadcast. */
	displayName: string;
	/** In the lobby, waiting to be admitted. */
	isWaiting: boolean;
	isHost: boolean;
	/** Muted by the conference, which is what a host's mute control does. */
	isMuted: boolean;
	/** Muted in their own client — what their own mic button did, and not a host's to undo. */
	isClientMuted: boolean;
	isCameraMuted: boolean;
	isPresenting: boolean;
	isSpotlight: boolean;
	raisedHand: boolean;
	can: PluginParticipantPermissions;
};

/** The viewer's own standing in the call, which is what decides whether they are offered the call-wide controls. */
export type PluginSelf = {
	participantUuid: string;
	micMuted: boolean;
	camMuted: boolean;
	clientMuted: boolean;
	isHost: boolean;
	canControl: boolean;
};

/** Everything the window can ask the provider to do. Each is a no-op until a plugin has said `ready`. */
export type ProviderPluginActions = {
	mute: (participantUuid: string, muted: boolean) => void;
	muteVideo: (participantUuid: string, muted: boolean) => void;
	admit: (participantUuid: string) => void;
	disconnect: (participantUuid: string) => void;
	spotlight: (participantUuid: string, active: boolean) => void;
	raiseHand: (participantUuid: string, raised: boolean) => void;
	setRole: (participantUuid: string, role: 'host' | 'guest') => void;
};

/** What the plugin makes of the call: who is in it, where the viewer stands, and what may be asked of either. */
export type ProviderPluginControls = {
	/** Empty until the plugin says `ready`, which is also what makes every control below unofferable. */
	features: ReadonlySet<PluginFeature>;
	self?: PluginSelf;
	participants: PluginParticipant[];
	actions: ProviderPluginActions;
};
