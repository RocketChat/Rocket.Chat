import { useMessageListOembedEnabled } from '../list/MessageListContext';

type OembedLayout = {
	enabled: boolean;
	maxHeight: number;
};

/**
 * Returns the layout parameters for oembeds
 */
export const useOembedLayout = (): OembedLayout => {
	const enabled = useMessageListOembedEnabled();
	const maxHeight = 368;

	return { enabled, maxHeight };
};
