// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Server } from 'net';

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
		setLanguage?: (language: string) => void;
		defaultUserLanguage?: () => string;
		DISABLE_ANIMATION?: boolean;
		lastMessageWindow?: Record<string, unknown>;
		lastMessageWindowHistory?: Record<string, unknown>;
		favico?: any;
		__meteor_runtime_config__: {
			ROOT_URL_PATH_PREFIX: string;
			ROOT_URL: string;
		};
	}

	interface PromiseConstructor {
		await<T>(promise: Promise<T>): T;
		await<T>(value: T): T;
	}

	namespace NodeJS {
		interface Process {
			emit(event: 'message', message: any, sendHandle?: Server | Socket): boolean;
		}
	}
}
