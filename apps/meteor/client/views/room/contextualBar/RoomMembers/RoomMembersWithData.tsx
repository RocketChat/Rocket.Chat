import { isRoomFederated, IRoom, IUser, isDirectMessageRoom, isTeamRoom } from '@rocket.chat/core-typings';
import { useMutableCallback, useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useUserRoom, useAtLeastOnePermission, useUser } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useState, ReactElement } from 'react';

import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import * as Federation from '../../../../lib/federation/Federation';
import { useMembersList } from '../../../hooks/useMembersList';
import { useTabBarClose } from '../../providers/ToolboxProvider';
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
	const handleClose = useTabBarClose();
	const [type, setType] = useLocalStorage<'online' | 'all'>('members-list-type', 'online');
	const [text, setText] = useState('');

	const isTeam = room && isTeamRoom(room);
	const isDirect = room && isDirectMessageRoom(room);

	const [state, setState] = useState<{ tab: ROOM_MEMBERS_TABS; userId?: IUser['_id'] }>({
		tab: ROOM_MEMBERS_TABS.LIST,
		userId: undefined,
	});

	const debouncedText = useDebouncedValue(text, 800);

	const { membersList, loadMoreItems, reload } = useMembersList(
		useMemo(() => ({ rid, type, limit: 50, debouncedText, roomType: room?.t as validRoomType }), [rid, type, debouncedText, room?.t]),
	);

	const { phase, items, itemCount: total } = useRecordList(membersList);

	const hasPermissionToAddUsers = useAtLeastOnePermission(
		useMemo(() => [room?.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room?.t]),
		rid,
	);

	const canAddUsers =
		room && user && isRoomFederated(room) ? Federation.isEditableByTheUser(user, room) && hasPermissionToAddUsers : hasPermissionToAddUsers;

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const openUserInfo = useMutableCallback((e) => {
		const { userid } = e.currentTarget.dataset;
		setState({
			tab: ROOM_MEMBERS_TABS.INFO,
			userId: userid,
		});
	});

	const openInvite = useMutableCallback(() => {
		setState({ tab: ROOM_MEMBERS_TABS.INVITE });
	});

	const openAddUser = useMutableCallback(() => {
		setState({ tab: ROOM_MEMBERS_TABS.ADD });
	});

	const handleBack = useCallback(() => {
		setState({ tab: ROOM_MEMBERS_TABS.LIST });
	}, [setState]);

	if (state.tab === ROOM_MEMBERS_TABS.INFO && state.userId) {
		return <UserInfoWithData rid={rid} uid={state.userId} onClose={handleClose} onClickBack={handleBack} />;
	}

	if (state.tab === ROOM_MEMBERS_TABS.INVITE) {
		return <InviteUsers rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === ROOM_MEMBERS_TABS.ADD) {
		return <AddUsers rid={rid} onClickBack={handleBack} reload={reload} />;
	}

	return (
		<RoomMembers
			rid={rid}
			isTeam={isTeam}
			isDirect={isDirect}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setText={handleTextChange}
			setType={setType}
			members={items}
			total={total}
			onClickClose={handleClose}
			onClickView={openUserInfo}
			loadMoreItems={loadMoreItems}
			reload={reload}
			{...(canAddUsers && { onClickAdd: openAddUser, onClickInvite: openInvite })}
		/>
	);
};

export default RoomMembersWithData;
