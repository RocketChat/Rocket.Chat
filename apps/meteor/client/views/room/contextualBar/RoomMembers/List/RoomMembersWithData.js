import { useMutableCallback, useDebouncedValue, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useUserRoom, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useState } from 'react';

import { useRecordList } from '../../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useMembersList } from '../../../../hooks/useMembersList';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import UserInfoWithData from '../../UserInfo';
import AddUsers from '../AddUsers';
import InviteUsers from '../InviteUsers';
import RoomMembers from './RoomMembers';

const RoomMembersWithData = ({ rid }) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();
	const room = useUserRoom(rid);
	const isTeam = room.teamMain;
	const isDirect = room.t === 'd';

	room.type = room.t;
	room.rid = rid;

	const [type, setType] = useLocalStorage('members-list-type', 'online');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 800);

	const { membersList, loadMoreItems, reload } = useMembersList(
		useMemo(() => ({ rid, type, limit: 50, debouncedText, roomType: room.t }), [rid, type, debouncedText, room.t]),
	);

	const { phase, items, itemCount: total } = useRecordList(membersList);

	const canAddUsers = useAtLeastOnePermission(
		useMemo(() => [room.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room.t]),
		rid,
	);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const viewUser = useMutableCallback((e) => {
		const { username } = e.currentTarget.dataset;
		setState({
			tab: 'UserInfo',
			username,
		});
	});

	const createInvite = useMutableCallback(() => {
		setState({ tab: 'InviteUsers' });
	});

	const addUser = useMutableCallback(() => {
		setState({ tab: 'AddUsers' });
	});

	const handleBack = useCallback(() => {
		setState({});
		reload();
	}, [setState, reload]);

	if (state.tab === 'UserInfo') {
		return <UserInfoWithData rid={rid} onClickClose={onClickClose} onClickBack={handleBack} username={state.username} />;
	}

	if (state.tab === 'InviteUsers') {
		return <InviteUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === 'AddUsers') {
		return <AddUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} reload={reload} />;
	}

	return (
		<RoomMembers
			rid={rid}
			isTeam={isTeam}
			isDirect={isDirect}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			members={items}
			total={total}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={canAddUsers && addUser}
			onClickInvite={canAddUsers && createInvite}
			loadMoreItems={loadMoreItems}
			reload={reload}
		/>
	);
};

export default RoomMembersWithData;
