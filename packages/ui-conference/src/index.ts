export { ConferenceContext, defaultConferenceContextValue, useConference } from './context/ConferenceContext.js';
export type { ConferenceContextValue, ConferencePanel } from './context/ConferenceContext.js';
export { OngoingCallsContext, defaultOngoingCallsContextValue, useOngoingCalls } from './context/OngoingCallsContext.js';
export type { OngoingCallsContextValue, CallRing } from './context/OngoingCallsContext.js';
export { useConferenceChatPanel } from './context/ChatPanelContext.js';
export type {
	ConferenceActions,
	ConferenceCall,
	ConferenceChatAccess,
	ConferenceFailure,
	ConferenceMember,
	ConferenceRoom,
	ConferenceSession,
	ConferenceSlots,
	PreflightMedia,
	UserPickerProps,
} from './context/definitions.js';

export { default as ConferenceWindow } from './views/ConferenceWindow.js';
export { default as ConferencePreflight } from './views/ConferencePreflight.js';
export { default as ConferenceStatePage } from './views/ConferenceStatePage.js';
export { default as ConferenceThreadModal } from './views/ConferenceThreadModal.js';
export { default as ConferenceViewport } from './views/ConferenceViewport.js';
export { default as OngoingCallsDropdown } from './views/OngoingCallsDropdown.js';

export { default as CallPanel } from './components/CallPanel.js';
export { default as CallPanelHeader } from './components/CallPanelHeader.js';
export { default as CallParticipants } from './components/CallParticipants.js';
export { default as CallTopBar, CALL_TOP_BAR_MIN_HEIGHT } from './components/CallTopBar.js';
export { default as ChatAccessModal } from './components/ChatAccessModal/ChatAccessModal.js';
export { default as ChatAccessNotice } from './components/ChatAccessNotice/ChatAccessNotice.js';
export { default as ConferenceChatNotShared } from './components/ConferenceChatNotShared.js';
export { default as ConferenceErrorState } from './components/ConferenceErrorState.js';
export { default as OngoingCallsList } from './components/OngoingCalls/OngoingCallsList.js';
export { default as SwitchCallModal } from './components/SwitchCallModal.js';

export {
	useCallDevicesInitialState,
	useCallRingPreference,
	useVideoQualityPreference,
	useNoiseSuppressionPreference,
	callPreferencesStorageKey,
	useUpdateCallPreferences,
	callDeviceIdField,
} from './hooks/useCallDevicesInitialState.js';
export type { CallPreferences, CallRingPreference, CallDevices, NoiseMethod, VideoQuality } from './hooks/useCallDevicesInitialState.js';
export { useRinging, useIsRinging } from './hooks/useRinging.js';
export type { RingingCandidate } from './hooks/useRinging.js';

export { hasConferenceChatAccess, chatAccessLeadsWithDiscussion } from './lib/chatAccess.js';
export { getConferenceMemberStatus } from './lib/memberStatus.js';
export type { ConferenceMemberStatus } from './lib/memberStatus.js';
export { PREFLIGHT_FACES_SHOWN, canDeclineCall } from './lib/constants.js';
export { CONFERENCE_THEMED_CLASS, narrowRoomStyle } from './lib/panelStyles.js';
// The provider-plugin protocol: its vocabulary, and the shapes the member rows and their controls read.
export { PLUGIN_FEATURES } from './lib/providerPlugin.js';
export type {
	PluginFeature,
	PluginParticipant,
	PluginParticipantPermissions,
	PluginSelf,
	ProviderPluginActions,
	ProviderPluginControls,
} from './lib/providerPlugin.js';
export {
	areAllGuestsMuted,
	canOfferControl,
	composeCallParticipants,
	matchesConferenceMember,
	resolveParticipant,
} from './lib/callParticipants.js';
export type { CallParticipantControl, CallParticipantEntry, CallParticipantGroups } from './lib/callParticipants.js';

// Shared with the application's own specs, which build the same calls and members this package's do.
export { buildJoinableCall, buildConferenceMember, buildChatAccess } from './fixtures/testFixtures.js';

// A call running in this window: the provider that runs it fills these, and the window's call parts read them.
export { CallStateProvider, CallActionsProvider, CallDiagnosticsProvider } from './call/context.js';
export type {
	CallState,
	CallSelf,
	CallConnectionState,
	RemoteParticipantInfo,
	ActiveReaction,
	CallActions,
	CallDiagnosticsData,
	ParticipantTrackStats,
} from './call/context.js';
export { VideoQualityProvider } from './devices/VideoQualityContext.js';
export type { VideoQualitySelection } from './devices/VideoQualityContext.js';
export { NoiseSuppressionProvider, supportsRnnoise } from './devices/NoiseSuppressionContext.js';
export type { NoiseSuppressionSelection } from './devices/NoiseSuppressionContext.js';
export { playHandRaiseChime, playJoinChime, playMutedReminder } from './call/lib/callChimes.js';
// Filled by the call with what its room has open, so the in-call device menus switch the room's devices.
export { PreviewVideoContext } from './call/previewVideo.js';
export type { PreviewVideo, PreviewVideoProviderProps, PreviewVideoTrack } from './call/previewVideo.js';
