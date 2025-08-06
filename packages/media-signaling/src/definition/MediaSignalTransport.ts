import type { AgentMediaSignal, ServerMediaSignal } from './MediaSignal';

export type MediaSignalAgentTransport = (signal: AgentMediaSignal) => void;

export type MediaSignalServerTransport = (signal: ServerMediaSignal) => void;
