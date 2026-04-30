import { BackendUnavailableError } from './errors';
import type { DevDbBackendKind, DevDbPaths, DevDbState } from './state-store';

export type DevDbBackendPolicy =
	| 'auto'
	| 'prefer-docker'
	| 'prefer-binary'
	| 'docker-only'
	| 'binary-only'
	| 'external-only';

export type DevDbBackendRunMode = 'auto' | 'docker' | 'binary' | 'external';

export type DevDbBackendSelection = {
	policy: DevDbBackendPolicy;
	runMode: DevDbBackendRunMode;
	selectedBackend: DevDbBackendKind;
};

export type UpContext = {
	paths: DevDbPaths;
	externalMongoUrl?: string;
	replicaSetEnabled: boolean;
	replicaSetName: string;
	port: number;
};

export type UpResult = {
	state: DevDbState;
	mongoUrl: string;
	mongoOplogUrl?: string;
};

export type DevDbBackend = {
	kind: DevDbBackendKind;
	up: (context: UpContext) => Promise<UpResult>;
	down: (state: DevDbState | undefined) => Promise<void>;
	logs: (state: DevDbState | undefined) => Promise<string>;
	reset: (state: DevDbState | undefined) => Promise<void>;
};

const parsePolicy = (value?: string): DevDbBackendPolicy => {
	switch (value) {
		case 'auto':
		case 'prefer-docker':
		case 'prefer-binary':
		case 'docker-only':
		case 'binary-only':
		case 'external-only':
			return value;
		default:
			return 'auto';
	}
};

const parseRunMode = (value?: string): DevDbBackendRunMode => {
	switch (value) {
		case 'auto':
		case 'docker':
		case 'binary':
		case 'external':
			return value;
		default:
			return 'auto';
	}
};

const selectByPolicy = (policy: DevDbBackendPolicy, hasExternalMongoUrl: boolean): DevDbBackendKind => {
	switch (policy) {
		case 'prefer-docker':
		case 'docker-only':
			return 'docker';
		case 'prefer-binary':
		case 'binary-only':
			return 'binary';
		case 'external-only':
			return 'external';
		case 'auto':
		default:
			return hasExternalMongoUrl ? 'external' : 'docker';
	}
};

export const resolveBackendSelection = (options: {
	policy?: string;
	runMode?: string;
}): DevDbBackendSelection => {
	const policy = parsePolicy(options.policy || process.env.DEV_DB_BACKEND_POLICY);
	const runMode = parseRunMode(options.runMode || process.env.DEV_DB_BACKEND);
	const hasExternalMongoUrl = Boolean(resolveExternalMongoUrl());

	if (runMode !== 'auto') {
		return {
			policy,
			runMode,
			selectedBackend: runMode,
		};
	}

	return {
		policy,
		runMode,
		selectedBackend: selectByPolicy(policy, hasExternalMongoUrl),
	};
};

export const resolveExternalMongoUrl = (): string | undefined => {
	return process.env.DEV_DB_EXTERNAL_MONGO_URL || process.env.MONGO_URL;
};

export const assertExternalMongoUrl = (mongoUrl: string | undefined): string => {
	if (!mongoUrl) {
		throw new BackendUnavailableError(
			'No external Mongo URL provided. Set DEV_DB_EXTERNAL_MONGO_URL or MONGO_URL for external backend.',
		);
	}

	return mongoUrl;
};
