// The single entry point both sides import the protocol through. Every module under
// `serialization/`, `framing/` and `contracts/` re-exports from here, so neither the host nor the
// subprocess ever reaches into a deep path.
export * from './rpc/contract';
