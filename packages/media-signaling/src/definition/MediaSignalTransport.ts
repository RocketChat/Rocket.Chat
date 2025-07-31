import type { MediaSignal } from './MediaSignal';

export type MediaSignalTransport = (signal: MediaSignal) => void;
