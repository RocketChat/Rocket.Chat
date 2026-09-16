import ThreadChat from '../room/contextualBar/Threads/components/ThreadChat';
import ThreadSkeleton from '../room/contextualBar/Threads/components/ThreadSkeleton';
import { useThreadMainMessageQuery } from '../room/contextualBar/Threads/hooks/useThreadMainMessageQuery';

type ConferenceThreadChatProps = {
	tmid: string;
	onEscape?: () => void;
};

/**
 * The call's thread: the room's thread, with the message it hangs off fetched here.
 *
 * In the room the thread is a tab, and whatever opened it already holds the main message. Here there is no tab
 * and nothing upstream has read it, so this reads it — and hands it on. Everything else a thread does is the
 * same conversation in the same room, which is why this is a wrapper and not a second implementation of it.
 */
const ConferenceThreadChat = ({ tmid, onEscape }: ConferenceThreadChatProps) => {
	// A thread whose main message has been deleted has nothing left to show, so it leaves the same way the reader
	// would have closed it.
	const mainMessageQueryResult = useThreadMainMessageQuery(tmid, { onDelete: onEscape });

	if (mainMessageQueryResult.isLoading) {
		return <ThreadSkeleton />;
	}

	if (!mainMessageQueryResult.isSuccess) {
		return null;
	}

	return (
		// `position='relative'` so the drop-target overlay covers the thread and not the panel around it, which is
		// what it would find to anchor to otherwise.
		<ThreadChat mainMessage={mainMessageQueryResult.data} onEscape={onEscape} position='relative' />
	);
};

export default ConferenceThreadChat;
