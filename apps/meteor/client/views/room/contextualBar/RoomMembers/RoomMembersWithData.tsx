import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom, isTeamRoom, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { useEffectEvent, useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import {
	useUserRoom,
	useAtLeastOnePermission,
	useUser,
	usePermission,
	useUserSubscription,
	useRoomToolbox,
} from '@rocket.chat/ui-contexts';
import type { ChangeEvent, MouseEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import * as Federation from '../../../../lib/federation/Federation';
import { useMembersList } from '../../../hooks/useMembersList';
import UserInfoWithData from '../UserInfo';
import AddUsers from './AddUsers';
import InviteUsers from './InviteUsers';
import RoomMembers from './RoomMembers';

enum ROOM_MEMBERS_TABS {
	INFO = 'user-info',
	INVITE = 'invite-users',
	ADD = 'add-users',
	LIST = 'users-list',
}

type validRoomType = 'd' | 'p' | 'c';

const RoomMembersWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const user = useUser();
	const room = useUserRoom(rid);
	const { closeTab } = useRoomToolbox();
	const [type, setType] = useLocalStorage<'online' | 'all'>('members-list-type', 'online');
	const [text, setText] = useState('');
	const subscription = useUserSubscription(rid);

	const isTeam = room && isTeamRoom(room);
	const isDirect = room && isDirectMessageRoom(room);
	const hasPermissionToCreateInviteLinks = usePermission('create-invite-links', rid);
	const isFederated = room && isRoomFederated(room);
	// we are dropping the non native federation for now
	const isFederationBlocked = room && !isRoomNativeFederated(room);

	const canCreateInviteLinks =
		room && user && isFederated && !isFederationBlocked
			? Federation.canCreateInviteLinks(user, room, subscription)
			: hasPermissionToCreateInviteLinks;

	const [state, setState] = useState<{ tab: ROOM_MEMBERS_TABS; user?: { id?: IUser['_id']; invitationDate?: string } }>({
		tab: ROOM_MEMBERS_TABS.LIST,
		user: undefined,
	});

	const debouncedText = useDebouncedValue(text, 800);

	const { data, fetchNextPage, isPending, refetch, hasNextPage } = useMembersList(
		useMemo(() => ({ rid, type, limit: 20, debouncedText, roomType: room?.t as validRoomType }), [rid, type, debouncedText, room?.t]),
	);

	const hasPermissionToAddUsers = useAtLeastOnePermission(
		useMemo(() => [room?.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room?.t]),
		rid,
	);

	const canAddUsers =
		room && user && isFederated && !isFederationBlocked
			? Federation.isEditableByTheUser(user, room, subscription)
			: hasPermissionToAddUsers;

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const openUserInfo = useEffectEvent((e: MouseEvent<HTMLElement>) => {
		const { userid: userId, invitationdate: invitationDate } = e.currentTarget.dataset;
		setState({
			tab: ROOM_MEMBERS_TABS.INFO,
			user: { id: userId, invitationDate },
		});
	});

	const openInvite = useEffectEvent(() => {
		setState({ tab: ROOM_MEMBERS_TABS.INVITE });
	});

	const openAddUser = useEffectEvent(() => {
		setState({ tab: ROOM_MEMBERS_TABS.ADD });
	});

	const handleBack = useEffectEvent(() => {
		setState({ tab: ROOM_MEMBERS_TABS.LIST });
	});

	if (state.tab === ROOM_MEMBERS_TABS.INFO && state.user?.id) {
		return (
			<UserInfoWithData
				rid={rid}
				uid={state.user.id}
				invitationDate={state.user.invitationDate}
				onClose={closeTab}
				onClickBack={handleBack}
			/>
		);
	}

	if (state.tab === ROOM_MEMBERS_TABS.INVITE) {
		return <InviteUsers rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === ROOM_MEMBERS_TABS.ADD) {
		return <AddUsers rid={rid} onClickBack={handleBack} reload={refetch} />;
	}

	return (
		<RoomMembers
			rid={rid}
			isTeam={isTeam}
			isDirect={isDirect}
			loading={isPending}
			type={type}
			text={text}
			setText={handleTextChange}
			setType={setType}
			members={data?.pages?.flatMap((page) => page.members) ?? []}
			total={data?.pages[data.pages.length - 1].total ?? 0}
			onClickClose={closeTab}
			onClickView={openUserInfo}
			loadMoreItems={hasNextPage ? fetchNextPage : () => undefined}
			reload={refetch}
			onClickInvite={canCreateInviteLinks && canAddUsers ? openInvite : undefined}
			onClickAdd={canAddUsers ? openAddUser : undefined}
			isABACRoom={Boolean(room?.abacAttributes)}
		/>
	);
};

export default RoomMembersWithData;
