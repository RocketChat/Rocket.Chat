/**
 * Construction-time context (the second `defineApp` factory arg, 0001 §3). Slice-1 stub: a
 * logger only. `info` and `settings` are deferred.
 */
export type AppSetupContext = {
	readonly logger: Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>;
};
