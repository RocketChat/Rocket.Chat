import { useMessageDisplay } from '../contexts/MessageDisplayContext';

const OEMBED_MAX_HEIGHT = 368;

/** Whether URL previews are shown, and the height they are capped at. */
export const useOembedLayout = () => {
	const { embedsEnabled } = useMessageDisplay();

	return { enabled: embedsEnabled, maxHeight: OEMBED_MAX_HEIGHT };
};
