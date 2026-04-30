import { BackendNotImplementedError } from '../errors';
import type { DevDbBackend, UpContext } from '../backend';
import type { DevDbState } from '../state-store';

const rejectNotImplemented = async (): Promise<never> => {
	throw new BackendNotImplementedError('binary');
};

const noop = async (_state: DevDbState | undefined): Promise<void> => {
	return;
};

export const binaryBackend: DevDbBackend = {
	kind: 'binary',
	up: async (_context: UpContext) => rejectNotImplemented(),
	down: noop,
	logs: async () => rejectNotImplemented(),
	reset: noop,
};
