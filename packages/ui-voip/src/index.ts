export { default as MediaCallProvider } from './providers/MediaCallProvider';

export {
	MediaCallInstanceContext,
	useMediaCallInstance,
	useWidgetExternalControls,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionFeatures,
	useMediaCallView,
} from './context';
export type { PeekMediaSessionStateReturn } from './context';
export type { PeerInfo } from './context';
export { useMediaCallAction, useMediaCallOpenRoomTracker } from './hooks';

export { CallHistoryContextualBar, MediaCallRoomActivity } from './views';
export type { CallHistoryData } from './views';
export * from './definitions/callHistoryContacts';

export { getHistoryMessagePayload } from './ui-kit/getHistoryMessagePayload';

export * from './views/MediaCallHistoryTable';

// Building blocks used by external call views (e.g. the group call view in
// apps/meteor) that want to render the same look-and-feel as the 1:1 call.
export { PeerCard, StreamCard, CardListContainer, CardListSection, CARD_LIST_SECTION_MAX_HEIGHT } from './components/Cards';
export { ActionStrip, ActionToggleChat } from './components/Actions';
export { default as ToggleButton } from './components/ToggleButton';
export { default as ActionButton } from './components/ActionButton';
export { default as Timer } from './components/Timer';

// Shared call section used by both 1:1 (driven by MediaCallViewProvider) and
// group calls (driven externally via a custom MediaCallViewContext value).
export { default as MediaCallRoomSection } from './views/MediaCallRoomSection/MediaCallRoomSection';
export { default as MediaCallViewContext, defaultMediaCallContextValue } from './context/MediaCallViewContext';
export type { RemoteParticipantInfo, MediaCallStreams } from './context/MediaCallViewContext';

// In-call notification chimes used by the Video Conference (LiveKit) UI —
// recording started/stopped and remote-participant joined. Synthesized via
// Web Audio so no asset files are needed. The legacy VoIP call sounds
// (ringer/dialer/call-ended) intentionally still go through the MP3 path
// in CustomSoundProvider.
export { playRecordingChime, playRecordingStopChime, playJoinChime } from './utils/callChimes';

// Per-call language selection — shared list of choices + helpers used by
// both the picker UI and the LK provider that synchronises the state.
export { CALL_LANGUAGES, DEFAULT_CALL_LANGUAGE, findCallLanguage } from './utils/callLanguages';
export type { CallLanguage } from './utils/callLanguages';
