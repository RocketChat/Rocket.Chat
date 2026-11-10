import { useMediaCallInstance } from './MediaCallInstanceContext';
import { useInstanceSnapshot } from './useInstanceSnapshot';

export type PeekMediaSessionCallIdReturn = string | undefined;

export const usePeekMediaSessionCallId = (): PeekMediaSessionCallIdReturn => {
	const { instance } = useMediaCallInstance();

	return useInstanceSnapshot(instance, (instance) => instance?.getState()?.tempCallId || undefined);
};
