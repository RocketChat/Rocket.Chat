import type { MediaSignal } from './signal';

export type MediaSignalTransport = (signal: MediaSignal) => void;
