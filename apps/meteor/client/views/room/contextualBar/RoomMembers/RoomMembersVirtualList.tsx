/* eslint-disable react/no-multi-comp */
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { createContext, forwardRef, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CustomItemComponentProps, VirtualizerHandle } from 'virtua';
import { Virtualizer } from 'virtua';

import { MembersListDivider } from './MembersListDivider';
import type { RoomMembersListRow, RoomMembersMemberRow } from './roomMembersListRows';
import { findActiveStickyIndex } from './roomMembersListRows';

const NEAR_BOTTOM_THRESHOLD = -20;

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

type StickyIndexContextValue = {
	activeIndex: number;
	stickyIndexes: Set<number>;
};

const listItemStyle = {
	listStyle: 'none',
} as const;

const listContainerStyle = {
	margin: 0,
	padding: 0,
	listStyle: 'none',
} as const;

const StickyIndexContext = createContext<StickyIndexContextValue>({
	activeIndex: -1,
	stickyIndexes: new Set(),
});

const ListLabelContext = createContext('Members');

const RoomMembersVirtualItem = forwardRef<HTMLLIElement, CustomItemComponentProps>(function RoomMembersVirtualItem(
	{ children, style, index },
	ref,
) {
	const { activeIndex, stickyIndexes } = useContext(StickyIndexContext);
	const isSticky = stickyIndexes.has(index);

	return (
		<li
			ref={ref}
			role='none'
			style={{
				...style,
				...listItemStyle,
				...(isSticky && {
					zIndex: 1,
				}),
				...(isSticky &&
					activeIndex === index && {
						position: 'sticky',
						top: 0,
					}),
			}}
		>
			{children}
		</li>
	);
});

type RoomMembersListContainerProps = {
	children: ReactNode;
	style: CSSProperties;
} & Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'style'>;

const RoomMembersListContainer = forwardRef<HTMLUListElement, RoomMembersListContainerProps>(function RoomMembersListContainer(
	{ children, style, ...props },
	ref,
) {
	const listLabel = useContext(ListLabelContext);

	return (
		<ul
			{...props}
			ref={ref}
			aria-label={listLabel}
			data-testid='room-members-virtual-list'
			role='listbox'
			style={{ ...listContainerStyle, ...style }}
		>
			{children}
		</ul>
	);
});

type RoomMembersVirtualListProps = {
	rows: RoomMembersListRow[];
	stickyIndexes: number[];
	loadedMembersCount: number;
	total: number;
	loadMoreItems: () => Promise<unknown> | void;
	listLabel: string;
	renderMemberRow: (row: RoomMembersMemberRow) => ReactNode;
};

export const RoomMembersVirtualList = ({
	rows,
	stickyIndexes,
	loadedMembersCount,
	total,
	loadMoreItems,
	listLabel,
	renderMemberRow,
}: RoomMembersVirtualListProps) => {
	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const isEndReachedLockedRef = useRef(false);
	const [activeStickyIndex, setActiveStickyIndex] = useState(() => stickyIndexes[0] ?? -1);

	const stickyIndexesSet = useMemo(() => new Set(stickyIndexes), [stickyIndexes]);
	const keepMounted = useMemo(
		() => (activeStickyIndex >= 0 && stickyIndexesSet.has(activeStickyIndex) ? [activeStickyIndex] : []),
		[activeStickyIndex, stickyIndexesSet],
	);

	const updateActiveStickyIndex = useCallback(
		(offset: number) => {
			const handle = virtualizerRef.current;
			if (!handle) {
				setActiveStickyIndex(stickyIndexes[0] ?? -1);
				return;
			}

			const visibleItemIndex = handle.findItemIndex(offset);
			const nextActiveStickyIndex = findActiveStickyIndex(stickyIndexes, visibleItemIndex);

			setActiveStickyIndex((currentActiveStickyIndex) =>
				currentActiveStickyIndex === nextActiveStickyIndex ? currentActiveStickyIndex : nextActiveStickyIndex,
			);
		},
		[stickyIndexes],
	);

	const checkEndReached = useCallback(
		async (offset: number) => {
			if (isEndReachedLockedRef.current) {
				return;
			}

			const handle = virtualizerRef.current;

			if (!handle || loadedMembersCount >= total) {
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

			try {
				await loadMoreItems();
			} catch {
				// Loading errors are surfaced by the query state; the scroll lock still needs to release.
			} finally {
				isEndReachedLockedRef.current = false;
			}
		},
		[loadMoreItems, loadedMembersCount, total],
	);

	const handleEndReachedScroll = useDebouncedCallback(
		(offset: number) => {
			void checkEndReached(offset);
		},
		300,
		[checkEndReached],
	);

	const handleScroll = useCallback(
		(offset: number) => {
			updateActiveStickyIndex(offset);
			handleEndReachedScroll(offset);
		},
		[handleEndReachedScroll, updateActiveStickyIndex],
	);

	useLayoutEffect(() => {
		isEndReachedLockedRef.current = false;

		const handle = virtualizerRef.current;
		if (!handle) {
			setActiveStickyIndex(stickyIndexes[0] ?? -1);
			return;
		}

		updateActiveStickyIndex(handle.scrollOffset);
		void checkEndReached(handle.scrollOffset);
	}, [checkEndReached, loadedMembersCount, rows.length, stickyIndexes, updateActiveStickyIndex]);

	const stickyIndexContextValue = useMemo(
		() => ({
			activeIndex: activeStickyIndex,
			stickyIndexes: stickyIndexesSet,
		}),
		[activeStickyIndex, stickyIndexesSet],
	);

	return (
		<ListLabelContext.Provider value={listLabel}>
			<StickyIndexContext.Provider value={stickyIndexContextValue}>
				<CustomVirtuaScrollbars>
					<div style={scrollViewportStyle}>
						<Virtualizer
							ref={virtualizerRef}
							as={RoomMembersListContainer}
							item={RoomMembersVirtualItem}
							bufferSize={50}
							keepMounted={keepMounted}
							onScroll={handleScroll}
						>
							{rows.map((row) => (
								<div key={row._id}>
									{row.type === 'divider' ? <MembersListDivider title={row.title} count={row.count} /> : renderMemberRow(row)}
								</div>
							))}
						</Virtualizer>
					</div>
				</CustomVirtuaScrollbars>
			</StickyIndexContext.Provider>
		</ListLabelContext.Provider>
	);
};
