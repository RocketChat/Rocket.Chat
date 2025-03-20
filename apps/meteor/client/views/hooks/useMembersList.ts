import type { IRole, IUser, AtLeast } from '@rocket.chat/core-typings';
import { useEndpoint, useSetting, useStream } from '@rocket.chat/ui-contexts';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { calculateRoomRolePriorityFromRoles } from '../../../lib/roles/calculateRoomRolePriorityFromRoles';

type MembersListOptions = {
	rid: string;
	type: 'all' | 'online';
	limit: number;
	debouncedText: string;
	roomType: 'd' | 'p' | 'c';
};

const endpointsByRoomType = {
	d: '/v1/im.members',
	p: '/v1/rooms.membersOrderedByRole',
	c: '/v1/rooms.membersOrderedByRole',
} as const;

export type RoomMember = Pick<IUser, 'username' | '_id' | 'name' | 'status' | 'freeSwitchExtension'> & { roles?: IRole['_id'][] };

type MembersListPage = { members: RoomMember[]; count: number; total: number; offset: number };

const getSortedMembers = (members: RoomMember[], useRealName = false) => {
	const membersWithRolePriority: (RoomMember & { rolePriority: number })[] = members.map((member) => ({
		...member,
		rolePriority: calculateRoomRolePriorityFromRoles(member.roles ?? []),
	}));

	return membersWithRolePriority.sort((a, b) => {
		if (a.rolePriority !== b.rolePriority) {
			return a.rolePriority - b.rolePriority;
		}

		if (a.status !== b.status) {
			if (!a.status || a.status === 'offline') {
				return 1;
			}
			if (!b.status || b.status === 'offline') {
				return -1;
			}
			return a.status.localeCompare(b.status) * -1;
		}

		if (useRealName && a.name && b.name) {
			return a.name.localeCompare(b.name);
		}

		const aUsername = a.username ?? '';
		const bUsername = b.username ?? '';
		return aUsername.localeCompare(bUsername);
	});
};

const updateMemberInCache = (
	options: MembersListOptions,
	queryClient: QueryClient,
	memberId: string,
	role: AtLeast<IRole, '_id'>,
	type: 'removed' | 'changed' | 'added',
	useRealName = false,
) => {
	queryClient.setQueryData(
		[options.roomType, 'members', options.rid, options.type, options.debouncedText],
		(oldData: InfiniteData<MembersListPage>) => {
			if (!oldData) {
				return oldData;
			}

			const allMembers = oldData.pages.flatMap((page) => {
				const members = page.members.map((member) => {
					if (member._id === memberId) {
						member.roles = member.roles ?? [];
						if (type === 'added' && !member.roles.includes(role._id)) {
							member.roles.push(role._id);
						} else if (type === 'removed') {
							member.roles = member.roles.filter((roleId) => roleId !== role._id);
						}
					}
					return member;
				});
				return members;
			});

			const sortedMembers = getSortedMembers(allMembers, useRealName);

			const newPages = oldData.pages.map((page) => {
				const { count, offset } = page;
				const newPage = {
					...page,
					members: sortedMembers.slice(offset, offset + count),
				};

				return newPage;
			});

			return {
				...oldData,
				pages: newPages,
			};
		},
	);
};

export const useMembersList = (options: MembersListOptions) => {
	const getMembers = useEndpoint('GET', endpointsByRoomType[options.roomType]);
	const useRealName = useSetting<boolean>('UI_Use_Real_Name', false);
	const queryClient = useQueryClient();

	const subscribeToNotifyLoggedIn = useStream('notify-logged');
	useEffect(() => {
		const unsubscribe = subscribeToNotifyLoggedIn('roles-change', ({ type, ...role }) => {
			if (!role.scope) {
				return;
			}

			if (!role.u?._id) {
				return;
			}

			updateMemberInCache(options, queryClient, role.u._id, role as IRole, type, useRealName);
		});
		return unsubscribe;
	}, [options, queryClient, subscribeToNotifyLoggedIn, useRealName]);

	return useInfiniteQuery({
		queryKey: [options.roomType, 'members', options.rid, options.type, options.debouncedText],
		queryFn: async ({ pageParam }) => {
			const start = pageParam ?? 0;

			return getMembers({
				roomId: options.rid,
				offset: start,
				count: options.limit,
				...(options.debouncedText && { filter: options.debouncedText }),
				...(options.type !== 'all' && { status: [options.type] }),
			});
		},
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			// if the offset is greater than the total, return undefined to stop the query from trying to fetch another page
			return offset >= lastPage.total ? undefined : offset;
		},
		initialPageParam: 0,
	});
};
