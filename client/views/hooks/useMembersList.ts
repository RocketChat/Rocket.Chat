import { useCallback, useMemo, useState } from 'react';

import { getConfig } from '../../../app/ui-utils/client/config';
import { IUser } from '../../../definition/IUser';
import { useMethod } from '../../contexts/ServerContext';
import { useScrollableRecordList } from '../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { RecordList } from '../../lib/lists/RecordList';

type MembersListOptions = {
	rid: string;
	type: 'all' | 'autoJoin';
	limit: number;
	debouncedText: string;
}

export const useMembersList = (
	options: MembersListOptions,
): {
		membersList: RecordList<IUser>;
		initialItemCount: number;
		reload: () => void;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const getUsersMethod = useMethod('getUsersOfRoom');
	const [membersList, setMembersList] = useState(() => new RecordList<IUser>());
	const reload = useCallback(() => setMembersList(new RecordList<IUser>()), []);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { records, total } = await getUsersMethod(
				options.rid,
				options.type,
				{
					limit: end - start,
					skip: start,
				},
				options.debouncedText,
			);

			return {
				items: records.map((members: any) => {
					members._updatedAt = new Date(members._updatedAt);
					return members;
				}),
				itemCount: total,
			};
		},
		[getUsersMethod, options],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(membersList, fetchData, useMemo(() => {
		const filesListSize = getConfig('teamsChannelListSize');
		return filesListSize ? parseInt(filesListSize, 10) : undefined;
	}, []));

	return {
		reload,
		membersList,
		loadMoreItems,
		initialItemCount,
	};
};
