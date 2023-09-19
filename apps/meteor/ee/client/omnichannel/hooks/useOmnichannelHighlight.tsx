import { useCurrentChatsHighlight } from './useCurrentChatsHighlight';

export const useOmnichannelHighlight = () => {
	const { isHighlit } = useCurrentChatsHighlight();

	return { isHighlit };
};
