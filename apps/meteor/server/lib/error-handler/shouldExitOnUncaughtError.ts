/**
 * Whether an unhandled error ends the process: always while the server is not serving yet, since a failed startup never
 * recovers and only a restart brings it up, and afterwards only when the environment asks for it.
 */
export const shouldExitOnUncaughtError = ({ serving, env }: { serving: boolean; env: NodeJS.ProcessEnv }): boolean =>
	!serving || Boolean(env.TEST_MODE || env.NODE_ENV === 'development' || env.EXIT_UNHANDLEDPROMISEREJECTION);
