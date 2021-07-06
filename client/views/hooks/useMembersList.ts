import { useCallback, useMemo, useState } from 'react';

import { getConfig } from '../../../app/ui-utils/client/config';
import { IUser } from '../../../definition/IUser';
import { useEndpoint } from '../../contexts/ServerContext';
import { useScrollableRecordList } from '../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { RecordList } from '../../lib/lists/RecordList';

type MembersListOptions = {
	rid: string;
	type: 'all' | 'online';
	limit: number;
	debouncedText: string;
	roomType: 'd' | 'p' | 'c';
};

const endpointsByRoomType = {
	d: 'im.members',
	p: 'groups.members',
	c: 'channels.members',
} as const;

export const useMembersList = (
	options: MembersListOptions,
): {
	membersList: RecordList<IUser>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const getMembers = useEndpoint('GET', endpointsByRoomType[options.roomType]);
	const [membersList, setMembersList] = useState(() => new RecordList<IUser>());
	const reload = useCallback(() => setMembersList(new RecordList<IUser>()), []);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { members, total } = await getMembers({
				roomId: options.rid,
				offset: start,
				count: end,
				...(options.debouncedText && { filter: options.debouncedText }),
				...(options.type !== 'all' && { status: [options.type] }),
			});

			return {
				items: members.map((members: any) => {
					members._updatedAt = new Date(members._updatedAt);
					return members;
				}),
				itemCount: total,
			};
		},
		[getMembers, options],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(
		membersList,
		fetchData,
		useMemo(() => {
			const filesListSize = getConfig('teamsChannelListSize');
			return filesListSize ? parseInt(filesListSize, 10) : undefined;
		}, []),
	);

	return {
		reload,
		membersList,
		loadMoreItems,
		initialItemCount,
	};
};
