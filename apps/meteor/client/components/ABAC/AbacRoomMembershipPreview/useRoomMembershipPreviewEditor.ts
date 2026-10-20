import type { AbacMembershipVerdict } from '@rocket.chat/core-typings';

import { useRoomMembershipPreviewPages } from './useRoomMembershipPreviewPages';

export type PreviewEditor = {
	verdict?: AbacMembershipVerdict;
	losesAccess: boolean;
};

export const useRoomMembershipPreviewEditor = (rid: string, attributes: Record<string, string[]>) => {
	const { data, error, isFetching, refetch } = useRoomMembershipPreviewPages(rid, attributes, '', 'loses');
	const verdict = data?.pages[0]?.editor;
	const hasFirstPage = !!data?.pages.length;
	const editorError = hasFirstPage ? null : error;

	const editor: PreviewEditor | undefined = hasFirstPage
		? { verdict, losesAccess: verdict !== undefined && verdict !== 'compliant' }
		: undefined;

	return {
		editor,
		error: editorError,
		isRetrying: !!editorError && isFetching,
		retry: () => void refetch({ cancelRefetch: false }),
	};
};
