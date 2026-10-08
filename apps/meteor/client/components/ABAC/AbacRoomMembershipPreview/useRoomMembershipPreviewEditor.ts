import type { AbacMembershipVerdict } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { usePreviewPages } from './usePreviewPages';

export type PreviewEditor = {
	verdict?: AbacMembershipVerdict;
	losesAccess: boolean;
};

export const useRoomMembershipPreviewEditor = (rid: string, attributes: Record<string, string[]>): PreviewEditor | undefined => {
	const { data } = usePreviewPages(rid, attributes, '', 'loses');
	const verdict = data?.pages[0]?.editor;
	const hasFirstPage = !!data?.pages.length;

	return useMemo(
		() => (hasFirstPage ? { verdict, losesAccess: verdict !== undefined && verdict !== 'compliant' } : undefined),
		[hasFirstPage, verdict],
	);
};
