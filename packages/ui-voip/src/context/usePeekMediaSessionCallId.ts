import { useMediaCallInstance } from './MediaCallInstanceContext.js';
import { useInstanceSnapshot } from './useInstanceSnapshot.js';

export type PeekMediaSessionCallIdReturn = string | undefined;

export const usePeekMediaSessionCallId = (): PeekMediaSessionCallIdReturn => {
	const { instance } = useMediaCallInstance();

	return useInstanceSnapshot(instance, (instance) => instance?.getState()?.tempCallId || undefined);
};
