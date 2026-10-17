import type { AbacMembershipGroup, AbacRoomPreviewMember } from '@rocket.chat/core-typings';
import { useUser, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { PreviewEditor } from './useRoomMembershipPreviewEditor';

const matchesSearch = (filter: string, fields: (string | undefined)[]) =>
	!filter || fields.some((field) => field?.toLowerCase().includes(filter.toLowerCase()));

export const useEditorFirst = (
	rid: string,
	members: AbacRoomPreviewMember[],
	editor: PreviewEditor | undefined,
	group: AbacMembershipGroup,
	filter: string,
): AbacRoomPreviewMember[] => {
	const user = useUser();
	const roles = useUserSubscription(rid)?.roles;
	const verdict = editor?.verdict;
	const inGroup = !!editor && editor.losesAccess === (group === 'loses');

	return useMemo(() => {
		if (!user) {
			return members;
		}

		const others = members.filter(({ _id }) => _id !== user._id);
		if (!verdict || !inGroup || !matchesSearch(filter, [user.username, user.name])) {
			return others;
		}

		const row: AbacRoomPreviewMember = {
			_id: user._id,
			username: user.username,
			name: user.name,
			verdict,
			...(roles?.length ? { roles } : {}),
		};
		return [row, ...others];
	}, [user, members, verdict, inGroup, filter, roles]);
};
