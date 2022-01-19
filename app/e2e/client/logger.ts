import { getConfig } from '../../../client/lib/utils/getConfig';

let debug: boolean | undefined = undefined;

const isDebugEnabled = (): boolean => {
	if (debug === undefined) {
		debug = getConfig('debug') === 'true' || getConfig('debug-e2e') === 'true';
	}

	return debug;
};

export const log = (context: string, ...msg: unknown[]): void => {
	isDebugEnabled() && console.log(`[${context}]`, ...msg);
};

export const logError = (context: string, ...msg: unknown[]): void => {
	isDebugEnabled() && console.error(`[${context}]`, ...msg);
};
