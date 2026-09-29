export { default as MediaCallProvider } from './providers/MediaCallProvider';

export {
	MediaCallInstanceContext,
	useMediaCallView,
	useWidgetExternalControls,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionFeatures,
} from './context';
export type { PeekMediaSessionStateReturn } from './context';
export type { PeerInfo } from './context';
export { useMediaCallAction, useMediaCallOpenRoomTracker } from './hooks';

export { CallHistoryContextualBar, MediaCallRoomActivity, InlineMediaCallWidget } from './views';
export type { CallHistoryData } from './views';
export * from './definitions/callHistoryContacts';

export { getHistoryMessagePayload } from './ui-kit/getHistoryMessagePayload';

export * from './views/MediaCallHistoryTable';

// Building blocks the conference window's own call UI is drawn with, so the two calls look and behave alike.
export { ActionButton, ToggleButton } from './components';
export { useDevicePermissionPrompt2, stopTracks } from './hooks';
export { usePlayMediaStream } from './providers/usePlayMediaStream';
