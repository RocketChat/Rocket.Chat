import { BackendNotImplementedError } from '../errors';
import type { DevDbBackend, UpContext } from '../backend';
import type { DevDbState } from '../state-store';

const rejectNotImplemented = async (backend: 'docker' | 'binary'): Promise<never> => {
	throw new BackendNotImplementedError(backend);
};

const noop = async (_state: DevDbState | undefined): Promise<void> => {
	return;
};

const logs = async (backend: 'docker' | 'binary'): Promise<string> => {
	throw new BackendNotImplementedError(backend);
};

const createNotImplementedBackend = (kind: 'docker' | 'binary'): DevDbBackend => ({
	kind,
	up: async (_context: UpContext) => rejectNotImplemented(kind),
	down: noop,
	logs: async () => logs(kind),
	reset: noop,
});

export const dockerBackend = createNotImplementedBackend('docker');
export const binaryBackend = createNotImplementedBackend('binary');
