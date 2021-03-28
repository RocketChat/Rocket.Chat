import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState } from 'react';

import { roomTypes } from '../../../../app/utils';
import { useSetModal } from '../../../contexts/ModalContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { RecordList } from '../../../lib/lists/RecordList.ts';
import CreateChannel from '../../../sidebar/header/CreateChannel';
import RoomInfo from '../../room/contextualBar/Info';
import { useTabBarClose } from '../../room/providers/ToolboxProvider';
import AddExistingModal from '../modals/AddExistingModal';
import BaseTeamChannels from './BaseTeamChannels';

const useReactModal = (Component, props) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		e.preventDefault();

		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} {...props} />);
	});
};

const TeamChannels = ({ teamId }) => {
	const [state, setState] = useState({});
	const onClickClose = useTabBarClose();

	const [type, setType] = useLocalStorage('channels-list-type', 'all');
	const [text, setText] = useState('');
	const [roomList] = useState(() => new RecordList());

	const roomListEndpoint = useEndpoint('GET', 'teams.listRooms');

	const fetchData = useCallback(async () => {
		const { rooms, total } = await roomListEndpoint({ teamId });

		const roomsDated = rooms.map((rooms) => {
			rooms._updatedAt = new Date(rooms._updatedAt);
			return { ...rooms };
		});
		return {
			items: roomsDated,
			itemCount: total,
		};
	}, [roomListEndpoint, teamId]);

	const { loadMoreItems } = useScrollableRecordList(roomList, fetchData);
	const { phase, items, itemCount } = useRecordList(roomList);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const addExisting = useReactModal(AddExistingModal, { teamId });
	const createNew = useReactModal(CreateChannel, { teamId });

	const goToRoom = useCallback((room) => roomTypes.openRouteLink(room.t, room), []);
	const handleBack = useCallback(() => setState({}), [setState]);
	const viewRoom = useMutableCallback((e) => {
		const { rid } = e.currentTarget.dataset;

		setState({
			tab: 'RoomInfo',
			rid,
		});
	});

	if (state.tab === 'RoomInfo') {
		return (
			<RoomInfo
				rid={state.rid}
				onClickClose={onClickClose}
				onClickBack={handleBack}
				onEnterRoom={goToRoom}
			/>
		);
	}

	return (
		<BaseTeamChannels
			loading={phase === 'loading'}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={itemCount}
			onClickClose={onClickClose}
			onClickAddExisting={addExisting}
			onClickCreateNew={createNew}
			onClickView={viewRoom}
			loadMoreItems={loadMoreItems}
		/>
	);
};

export default TeamChannels;
