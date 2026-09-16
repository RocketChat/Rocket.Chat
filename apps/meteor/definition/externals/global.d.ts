import type { Server } from 'net';

declare global {
	interface Navigator {
		/** @deprecated */
		readonly userLanguage?: string;
	}

	const __meteor_runtime_config__: {
		ROOT_URL_PATH_PREFIX: string;
		ROOT_URL: string;
	};

	interface Window {
		defaultUserLanguage?: () => string;
		DISABLE_ANIMATION?: boolean;
		/** Page size for paginated endpoints, injected by the server from the API_Upper_Count_Limit setting. */
		__API_COUNT_LIMIT__?: number;
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
