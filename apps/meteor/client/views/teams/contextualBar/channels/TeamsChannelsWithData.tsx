import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback, useLocalStorage, useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, usePermission } from '@rocket.chat/ui-contexts';
import type { FC, SyntheticEvent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import CreateChannelWithData from '../../../../sidebar/header/CreateChannel';
import { useRoom } from '../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../room/contexts/RoomToolboxContext';
import RoomInfo from '../../../room/contextualBar/Info';
import AddExistingModal from './AddExistingModal';
import TeamsChannels from './TeamsChannels';
import { useTeamsChannelList } from './hooks/useTeamsChannelList';

const useReactModal = (Component: FC<any>, teamId: string, reload: () => void) => {
	const setModal = useSetModal();

	return useMutableCallback((e: SyntheticEvent) => {
		e.preventDefault();

		const handleClose = () => {
			setModal(null);
			reload();
		};

		setModal(() => <Component onClose={handleClose} teamId={teamId} />);
	});
};

const TeamsChannelsWithData = () => {
	const room = useRoom();
	const { teamId } = room;

	if (!teamId) {
		throw new Error('Invalid teamId');
	}

	const [state, setState] = useState<{ tab?: string; rid?: string }>({});
	const { closeTab } = useRoomToolbox();

	const [type, setType] = useLocalStorage<'all' | 'autoJoin'>('channels-list-type', 'all');
	const [text, setText] = useState('');

	const debouncedText = useDebouncedValue(text, 800);

	const { teamsChannelList, loadMoreItems, reload } = useTeamsChannelList(
		useMemo(() => ({ teamId, text: debouncedText, type }), [teamId, debouncedText, type]),
	);

	const { phase, items, itemCount: total } = useRecordList(teamsChannelList);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	const canAddExistingTeam = usePermission('add-team-channel', room._id);
	const addExisting = useReactModal(AddExistingModal, teamId, reload);
	const createNew = useReactModal(CreateChannelWithData, teamId, reload);

	const goToRoom = useCallback((room) => roomCoordinator.openRouteLink(room.t, room), []);
	const handleBack = useCallback(() => setState({}), [setState]);
	const viewRoom = useEffectEvent((room: IRoom) => {
		goToRoom(room);
	});

	if (state?.tab === 'RoomInfo' && state?.rid) {
		return <RoomInfo onClickBack={handleBack} onEnterRoom={goToRoom} resetState={() => setState({})} />;
	}

	return (
		<TeamsChannels
			loading={phase === AsyncStatePhase.LOADING}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={total}
			onClickClose={closeTab}
			onClickAddExisting={canAddExistingTeam && addExisting}
			onClickCreateNew={canAddExistingTeam && createNew}
			onClickView={viewRoom}
			loadMoreItems={loadMoreItems}
			reload={reload}
		/>
	);
};

export default TeamsChannelsWithData;
