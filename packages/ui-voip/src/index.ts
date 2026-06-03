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

// In-call notification chimes (recording started/stopped, participant joined,
// call ended). All synthesized via Web Audio — no asset files. The looped
// ones (ringer/dialer) return a stop function — caller must invoke it to
// silence the loop.
export {
	playRecordingChime,
	playRecordingStopChime,
	playJoinChime,
	playCallEndedChime,
	startRingerChime,
	startDialerChime,
} from './utils/callChimes';
