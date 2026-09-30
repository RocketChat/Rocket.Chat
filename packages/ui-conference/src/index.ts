export { ConferenceContext, defaultConferenceContextValue, useConference } from './context/ConferenceContext';
export type { ConferenceContextValue, ConferencePanel } from './context/ConferenceContext';
export { OngoingCallsContext, defaultOngoingCallsContextValue, useOngoingCalls } from './context/OngoingCallsContext';
export type { OngoingCallsContextValue, CallRing } from './context/OngoingCallsContext';
export { useConferenceChatPanel } from './context/ChatPanelContext';
export type {
	ConferenceActions,
	ConferenceCall,
	ConferenceChatAccess,
	ConferenceFailure,
	ConferenceMedia,
	ConferenceMember,
	ConferenceRoom,
	ConferenceSession,
	ConferenceSlots,
	PreflightMedia,
	UserPickerProps,
} from './context/definitions';

export { default as ConferenceWindow } from './views/ConferenceWindow';
export { default as ConferencePreflight } from './views/ConferencePreflight';
export { default as ConferenceStatePage } from './views/ConferenceStatePage';
export { default as ConferenceThreadModal } from './views/ConferenceThreadModal';
export { default as ConferenceViewport } from './views/ConferenceViewport';
export { default as OngoingCallsDropdown } from './views/OngoingCallsDropdown';

export { default as CallPanel } from './components/CallPanel';
export { default as CallPanelHeader } from './components/CallPanelHeader';
export { default as CallParticipants } from './components/CallParticipants';
export { default as CallTopBar, CALL_TOP_BAR_MIN_HEIGHT } from './components/CallTopBar';
export { default as ChatAccessModal } from './components/ChatAccessModal/ChatAccessModal';
export { default as ChatAccessNotice } from './components/ChatAccessNotice/ChatAccessNotice';
export { default as ConferenceChatNotShared } from './components/ConferenceChatNotShared';
export { default as ConferenceErrorState } from './components/ConferenceErrorState';
export { default as OngoingCallsList } from './components/OngoingCalls/OngoingCallsList';
export { default as SwitchCallModal } from './components/SwitchCallModal';

export {
	useCallDevicesInitialState,
	useCallRingPreference,
	useNoiseSuppressionPreference,
	useVideoQualityPreference,
	useBackgroundBlurPreference,
	callPreferencesStorageKey,
} from './hooks/useCallDevicesInitialState';
export type {
	CallPreferences,
	CallRingPreference,
	CallDevices,
	CallDeviceKind,
	NoiseMethod,
	VideoQuality,
	BlurLevel,
	BlurModel,
} from './hooks/useCallDevicesInitialState';
export { useRinging, useIsRinging } from './hooks/useRinging';
export type { RingingCandidate } from './hooks/useRinging';

export { hasConferenceChatAccess, chatAccessLeadsWithDiscussion } from './lib/chatAccess';
export { getConferenceMemberStatus } from './lib/memberStatus';
export type { ConferenceMemberStatus } from './lib/memberStatus';
export { PREFLIGHT_FACES_SHOWN, canDeclineCall } from './lib/constants';
export { CONFERENCE_THEMED_CLASS, narrowRoomStyle } from './lib/panelStyles';
// The provider-plugin protocol: its vocabulary, and the shapes the member rows and their controls read.
export { PLUGIN_FEATURES } from './lib/providerPlugin';
export type {
	PluginFeature,
	PluginParticipant,
	PluginParticipantPermissions,
	PluginSelf,
	ProviderPluginActions,
	ProviderPluginControls,
} from './lib/providerPlugin';
export {
	areAllGuestsMuted,
	canOfferControl,
	composeCallParticipants,
	matchesConferenceMember,
	resolveParticipant,
} from './lib/callParticipants';
export type { CallParticipantControl, CallParticipantEntry, CallParticipantGroups } from './lib/callParticipants';

// Shared with the application's own specs, which build the same calls and members this package's do.
export { buildJoinableCall, buildConferenceMember, buildChatAccess } from './fixtures/testFixtures';
export type { Presenter } from './components/CallPresenting';
export type { RaisedHand } from './components/CallRaisedHands';
