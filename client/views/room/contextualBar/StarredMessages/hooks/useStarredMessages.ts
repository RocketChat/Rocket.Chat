import { useMessageList } from './useMessageList';
import { IMessage } from '../../../../../../definition/IMessage';
import { useStarredMessagesFromEndpoint } from './useStarredMessagesFromEndpoint';
import { useStarredMessagesFromStreams } from './useStarredMessagesFromStreams';

export { useUnstarMessage } from './useUnstarMessage';

export const useStarredMessages = (rid: IMessage['rid']): any => {
	const { messages, error, update } = useMessageList();
	const loadMore = useStarredMessagesFromEndpoint(rid, update);
	useStarredMessagesFromStreams(rid, update);

	return {
		messages,
		error,
		loadMore,
	};
};
