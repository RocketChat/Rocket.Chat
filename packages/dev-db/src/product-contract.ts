export const DEV_DB_COMMANDS = ['up', 'down', 'status', 'url', 'logs', 'doctor', 'reset'] as const;

export type DevDbCommand = (typeof DEV_DB_COMMANDS)[number];

export const DEV_DB_DX_OUTCOMES = {
	oneCommandStartup: 'Start development DB with one command.',
	noManualInstall: 'No manual database installation required from contributors.',
	deterministicUrlOutput: 'Stable URL output for both humans and scripts.',
	cleanStopAndReset: 'Explicit clean stop and deterministic reset operations.',
	actionableDiagnostics: 'Actionable diagnostics and deterministic exit codes.',
} as const;

export const DEV_DB_ENV_OUTPUT_MODES = ['text', 'json'] as const;

export type DevDbOutputMode = (typeof DEV_DB_ENV_OUTPUT_MODES)[number];

export type DevDbResolvedUrls = {
	mongoUrl: string;
	mongoOplogUrl?: string;
};

export type DevDbJsonOutput = {
	backend: 'docker' | 'binary' | 'external';
	policy: 'auto' | 'prefer-docker' | 'prefer-binary' | 'docker-only' | 'binary-only' | 'external-only';
	urls: DevDbResolvedUrls;
	replicaSet: {
		enabled: boolean;
		name?: string;
	};
	timestamp: string;
};

export const DEV_DB_RUNTIME_COMPATIBILITY_MATRIX = {
	macOS: ['arm64', 'x64'],
	linux: ['x64', 'aarch64'],
	windows: ['x64'],
} as const;

export type DevDbPlatform = keyof typeof DEV_DB_RUNTIME_COMPATIBILITY_MATRIX;
