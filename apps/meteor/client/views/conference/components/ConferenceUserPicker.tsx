import { isDirectMessageRoom, isPrivateRoom, isPublicRoom } from '@rocket.chat/core-typings';
import type { UserPickerProps } from '@rocket.chat/ui-conference';
import { useEndpoint, useUserRoom } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { roomsQueryKeys } from '../../../lib/queryKeys';

/** What to ask for per page. The server may answer with fewer — see the query below. */
const MEMBERS_PAGE = 100;

/**
 * The product's own way of picking people, with the call's room members left out of the options.
 *
 * Members of the room can already join, so offering them would be offering a no-op. Knowing who they are means
 * reading the room, which is why this sits here rather than in the modal it fills: the modal is a frame around
 * whichever picker it is given, and this is the one the workspace has.
 *
 * Present only for participants who can read the chat: a member added from outside the room has no room here,
 * and must still be able to add people.
 */
const ConferenceUserPicker = ({ rid, value, onChange, error, placeholder }: UserPickerProps & { rid?: string }) => {
	const room = useUserRoom(rid ?? '');

	// DMs expose their members on the room doc. Channels and private groups come from the one members endpoint,
	// which does not care which of the two it is — but does refuse anything else, an omnichannel room included.
	// So nothing is asked for those, and the picker offers everyone: a redundant option rather than a wrong
	// outcome, since the server skips whoever is already associated with the call and the modal says as much.
	// Asking anyway would have been a request that fails every time for the same list.
	const getMembers = useEndpoint('GET', '/v1/rooms.membersOrderedByRole');
	const membersQuery = useQuery({
		enabled: !!rid && !!room && (isPublicRoom(room) || isPrivateRoom(room)),
		queryKey: roomsQueryKeys.members(rid ?? '', room?.t ?? 'c'),
		queryFn: async () => {
			// How many come back is the server's decision, not ours: `API_Upper_Count_Limit` caps every paginated
			// endpoint and is not readable from here, so a workspace that sets it to 5 answers a request for 100
			// with 5. Asking once and assuming the answer was complete left room members in the picker as if they
			// were not members at all.
			//
			// So the first answer says how many there are, and the rest are asked for at once rather than one
			// after another: a room of a thousand under a low cap is a queue of requests the picker waits behind,
			// and they do not depend on each other.
			const first = await getMembers({ roomId: rid ?? '', offset: 0, count: MEMBERS_PAGE });

			if (!first.count || first.members.length >= first.total) {
				return first.members;
			}

			const rest = await Promise.all(
				Array.from({ length: Math.ceil((first.total - first.count) / first.count) }, (_, page) =>
					getMembers({ roomId: rid ?? '', offset: first.count * (page + 1), count: MEMBERS_PAGE }),
				),
			);

			return [...first.members, ...rest.flatMap(({ members }) => members)];
		},
	});

	const memberUsernames = useMemo(() => {
		// Asked of the room rather than carried in a flag: `usernames` is optional on a room and required on a
		// direct one, so the narrowing is what says this list exists at all.
		if (room && isDirectMessageRoom(room)) {
			return room.usernames;
		}

		return (membersQuery.data ?? [])
			.map((member) => member.username)
			.filter((username): username is string => typeof username === 'string');
	}, [room, membersQuery.data]);

	return (
		// Shut until the room's membership is in, when there is one to wait for: `exceptions` is what keeps
		// existing members out of the options, and typing before it arrived offered them as if they were not
		// members at all. `isLoading` and not `isPending`, which a query disabled for the rooms that have no
		// member list to ask for never stops being.
		<UserAutoCompleteMultiple
			value={value}
			onChange={onChange}
			disabled={membersQuery.isLoading}
			error={error}
			exceptions={memberUsernames}
			placeholder={placeholder}
		/>
	);
};

export default ConferenceUserPicker;
