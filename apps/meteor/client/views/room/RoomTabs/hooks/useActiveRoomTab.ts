import { useSearchParameter } from '@rocket.chat/ui-contexts';

export type RoomTab = 'chat' | 'threads';

/**
 * Where the room tabs live in the URL. Search parameters rather than the route's `tab`/`context`: those belong to
 * the Chat tab's contextual bar, which stays as it was while the user is on another tab.
 */
export const ROOM_TABS_SEARCH = {
	tab: 'view',
	threadsTabThread: 'thread',
} as const;

const THREADS_TAB = 'threads';

export const useActiveRoomTab = (): RoomTab => (useSearchParameter(ROOM_TABS_SEARCH.tab) === THREADS_TAB ? 'threads' : 'chat');

/** The thread open on the Threads tab, if any. */
export const useThreadsTabThread = () => useSearchParameter(ROOM_TABS_SEARCH.threadsTabThread) || undefined;

export const threadsTabSearch = (tmid?: string) => ({
	[ROOM_TABS_SEARCH.tab]: THREADS_TAB,
	...(tmid && { [ROOM_TABS_SEARCH.threadsTabThread]: tmid }),
});
