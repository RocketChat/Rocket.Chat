import type { Server } from 'net';

declare global {
	interface Navigator {
		/** @deprecated */
		readonly userLanguage?: string;
	}

	const __meteor_runtime_config__: {
		ROOT_URL_PATH_PREFIX: string;
		ROOT_URL: string;
		/** Set only by the vite dev client: the server behind the local proxy */
		UPSTREAM_ROOT_URL?: string;
		PUBLIC_SETTINGS?: Record<string, unknown>;
		accountsConfigCalled?: boolean;
		meteorEnv: {
			TEST_METADATA?: string;
			NODE_ENV?: string;
		};
		ACCOUNTS_CONNECTION_URL?: string;
		isModern?: boolean;
		gitCommitHash?: string;
		meteorRelease?: string;
		debug?: boolean;
	};

	interface Window {
		defaultUserLanguage?: () => string;
		DISABLE_ANIMATION?: boolean;
		ServiceConfiguration?: unknown;
		__meteor_runtime_config__: {
			ROOT_URL_PATH_PREFIX: string;
			ROOT_URL: string;
		};
	}

	namespace NodeJS {
		interface Process {
			emit(event: 'message', message: any, sendHandle?: Server | Socket): boolean;
		}
	}
}
