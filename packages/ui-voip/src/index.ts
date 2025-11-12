import './global.d.ts';

export { default as MediaCallProvider } from './v2/MediaCallProvider';

export * from './hooks';

export { MediaCallContext, useMediaCallExternalContext as useMediaCallContext, useMediaCallAction, type PeerInfo } from './v2';
