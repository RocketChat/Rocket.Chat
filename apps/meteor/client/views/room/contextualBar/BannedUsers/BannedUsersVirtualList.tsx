import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { VirtualizerHandle } from 'virtua';
import { Virtualizer } from 'virtua';

import BannedUsersItem from './BannedUsersItem';
import BannedUsersScrollViewport from './BannedUsersScrollViewport';
import type { BannedUser } from '../../../hooks/useRoomBannedUsers';

const BUFFER_SIZE = 50;
const NEAR_BOTTOM_THRESHOLD = -50;

type BannedUsersVirtualListProps = {
	bannedUsers: BannedUser[];
	useRealName: boolean;
	onClickUnban: (username: string) => void;
	onLoadMore: () => void;
};

const BannedUsersVirtualList = ({ bannedUsers, useRealName, onClickUnban, onLoadMore }: BannedUsersVirtualListProps) => {
	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const isEndReachedLockedRef = useRef(false);
	const onLoadMoreRef = useRef(onLoadMore);
	const firstUserId = bannedUsers[0]?._id ?? '';
	const lastUserId = bannedUsers[bannedUsers.length - 1]?._id ?? '';

	onLoadMoreRef.current = onLoadMore;

	const checkEndReached = useCallback((offset: number) => {
		if (isEndReachedLockedRef.current) {
			return;
		}

		const handle = virtualizerRef.current;
		if (!handle) {
			return;
		}

		const { scrollSize, viewportSize } = handle;
		if (viewportSize <= 0) {
			return;
		}

		const nearBottom = offset - scrollSize + viewportSize >= NEAR_BOTTOM_THRESHOLD;
		if (!nearBottom) {
			return;
		}

		isEndReachedLockedRef.current = true;
		onLoadMoreRef.current();
	}, []);

	const handleScroll = useDebouncedCallback(
		(offset: number) => {
			checkEndReached(offset);
		},
		300,
		[checkEndReached],
	);

	useLayoutEffect(() => {
		isEndReachedLockedRef.current = false;

		const handle = virtualizerRef.current;
		if (!handle) {
			return;
		}

		checkEndReached(handle.scrollOffset);
	}, [bannedUsers.length, checkEndReached, firstUserId, lastUserId]);

	return (
		<VirtualizedScrollbars>
			<BannedUsersScrollViewport>
				<Virtualizer ref={virtualizerRef} as='div' item='div' bufferSize={BUFFER_SIZE} onScroll={handleScroll}>
					{bannedUsers.map((user) => (
						<BannedUsersItem key={user._id} user={user} useRealName={useRealName} onClickUnban={onClickUnban} />
					))}
				</Virtualizer>
			</BannedUsersScrollViewport>
		</VirtualizedScrollbars>
	);
};

export default BannedUsersVirtualList;
