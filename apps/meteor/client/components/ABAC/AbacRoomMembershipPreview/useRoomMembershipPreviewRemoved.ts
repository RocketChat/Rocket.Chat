import type { AbacPreviewCursor, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import type { InfiniteData } from '@tanstack/react-query';

import { useRoomMembershipPreviewPages } from './useRoomMembershipPreviewPages';

const countAllMembers = (data?: InfiniteData<IAbacRoomMembershipPreview, AbacPreviewCursor | undefined>) => {
	const pages = data?.pages;
	if (!pages?.length || pages.at(-1)?.next) {
		return undefined;
	}
	return pages.reduce((sum, page) => sum + page.members.length, 0);
};

const getRemoved = (total: number | undefined, lost: number | undefined, kept: number | undefined) => {
	if (total === undefined) {
		return undefined;
	}
	if (lost !== undefined) {
		return lost;
	}
	if (kept !== undefined) {
		return total - kept;
	}
	return undefined;
};

export const useRoomMembershipPreviewRemoved = (rid: string, attributes: Record<string, string[]>) => {
	const { data: loses } = useRoomMembershipPreviewPages(rid, attributes, '', 'loses');
	const { data: retains } = useRoomMembershipPreviewPages(rid, attributes, '', 'retains', { enabled: false });

	const total = loses?.pages[0]?.total ?? retains?.pages[0]?.total;
	const removed = getRemoved(total, countAllMembers(loses), countAllMembers(retains));

	return {
		removed,
		total,
		removesEveryone: removed !== undefined && removed > 0 && removed === total,
	};
};
