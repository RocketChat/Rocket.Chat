import React, { useCallback, useMemo, useState } from 'react';
import {
	useMutableCallback,
	useDebouncedValue,
	useLocalStorage,
} from '@rocket.chat/fuselage-hooks';

import { useTabBarClose } from '../../room/providers/ToolboxProvider';
import { useUserRoom } from '../../../contexts/UserContext';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import UserInfoWithData from '../../room/contextualBar/UserInfo';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { RoomMembers } from '../../room/contextualBar/RoomMembers/List/RoomMembers';
import { useMethod } from '../../../contexts/ServerContext';
import { useDataWithLoadMore } from '../../room/contextualBar/hooks/useDataWithLoadMore';
import AddUsers from '../../room/contextualBar/RoomMembers/AddUsers';
import InviteUsers from '../../room/contextualBar/RoomMembers/InviteUsers';

const useGetUsersOfRoom = (params) => {
	const method = useMethod('getUsersOfRoom');
	return useDataWithLoadMore(useCallback((args) => method(...args), [method]), params);
};

export default ({
	rid,
}) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();
	const room = useUserRoom(rid);

	room.type = room.t;
	room.rid = rid;

	const [type, setType] = useLocalStorage('members-list-type', 'online');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 500);
	const params = useMemo(() => [rid, type === 'all', { limit: 50 }, debouncedText], [rid, type, debouncedText]);

	const { value, phase, more, error } = useGetUsersOfRoom(params);

	const canAddUsers = useAtLeastOnePermission(useMemo(() => [room.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room.t]), rid);

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

	const handleBack = useCallback(() => setState({}), [setState]);

	const loadMoreItems = useCallback((start, end) => more(([rid, type, , filter]) => [rid, type, { skip: start, limit: end - start }, filter], (prev, next) => ({
		total: next.total,
		finished: next.records.length < 50,
		records: [...prev.records, ...next.records],
	})), [more]);

	if (state.tab === 'UserInfo') {
		return <UserInfoWithData rid={rid} onClickClose={onClickClose} onClickBack={handleBack} username={state.username} />;
	}

	if (state.tab === 'InviteUsers') {
		return <InviteUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	if (state.tab === 'AddUsers') {
		return <AddUsers onClickClose={onClickClose} rid={rid} onClickBack={handleBack} />;
	}

	return (
		<RoomMembers
			rid={rid}
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			error={error}
			setType={setType}
			setText={handleTextChange}
			members={value?.records}
			total={value?.total}
			onClickClose={onClickClose}
			onClickView={viewUser}
			onClickAdd={canAddUsers && addUser}
			onClickInvite={canAddUsers && createInvite}
			loadMoreItems={loadMoreItems}
		/>
	);
};
