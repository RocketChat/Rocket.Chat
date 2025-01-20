import type { IRole, IUser, AtLeast } from '@rocket.chat/core-typings';
import { useEndpoint, useSetting, useStream } from '@rocket.chat/ui-contexts';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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

type RoomMember = Pick<IUser, 'username' | '_id' | 'name' | 'status' | 'freeSwitchExtension'> & { roles?: IRole['_id'][] };

const getSortedMembers = (members: RoomMember[], useRealName = false) => {
	return members.sort((a, b) => {
		const aRoles = a.roles ?? [];
		const bRoles = b.roles ?? [];
		const isOwnerA = aRoles.includes('owner');
		const isOwnerB = bRoles.includes('owner');
		const isModeratorA = aRoles.includes('moderator');
		const isModeratorB = bRoles.includes('moderator');

		if (isOwnerA !== isOwnerB) {
			return isOwnerA ? -1 : 1;
		}

		if (isModeratorA !== isModeratorB) {
			return isModeratorA ? -1 : 1;
		}

		if ((a.status === 'online' || b.status === 'online') && a.status !== b.status) {
			return a.status === 'online' ? -1 : 1;
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
		(oldData: InfiniteData<{ members: RoomMember[] }>) => {
			if (!oldData) {
				return oldData;
			}

			const newPages = oldData.pages.map((page) => {
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
				return {
					...page,
					members: getSortedMembers(members, useRealName),
				};
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
				count: 20,
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
