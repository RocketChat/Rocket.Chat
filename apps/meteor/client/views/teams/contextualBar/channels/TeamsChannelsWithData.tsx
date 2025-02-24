import type { IRoom } from '@rocket.chat/core-typings';
import { useLocalStorage, useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, usePermission, useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import AddExistingModal from './AddExistingModal';
import TeamsChannels from './TeamsChannels';
import { useTeamsChannelList } from './hooks/useTeamsChannelList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import CreateChannelWithData from '../../../../sidebar/header/CreateChannel';
import { useRoom } from '../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../room/contexts/RoomToolboxContext';

const TeamsChannelsWithData = () => {
	const room = useRoom();
	const setModal = useSetModal();
	const { closeTab } = useRoomToolbox();
	const canAddExistingRoomToTeam = usePermission('move-room-to-team', room._id);
	const canCreateRoomInTeam = useAtLeastOnePermission(['create-team-channel', 'create-team-group'], room._id);

	const { teamId } = room;

	if (!teamId) {
		throw new Error('Invalid teamId');
	}

	const [type, setType] = useLocalStorage<'all' | 'autoJoin'>('channels-list-type', 'all');
	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 800);

	const { teamsChannelList, loadMoreItems, reload } = useTeamsChannelList(
		useMemo(() => ({ teamId, text: debouncedText, type }), [teamId, debouncedText, type]),
	);

	const { phase, items, itemCount: total } = useRecordList(teamsChannelList);

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const handleAddExisting = useEffectEvent(() => {
		setModal(<AddExistingModal teamId={teamId} onClose={() => setModal(null)} reload={reload} />);
	});

	const handleCreateNew = useEffectEvent(() => {
		setModal(<CreateChannelWithData teamId={teamId} mainRoom={room} onClose={() => setModal(null)} reload={reload} />);
	});

	const goToRoom = useEffectEvent((room: IRoom) => {
		roomCoordinator.openRouteLink(room.t, room);
	});

	return (
		<TeamsChannels
			loading={phase === AsyncStatePhase.LOADING}
			mainRoom={room}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={items}
			total={total}
			onClickClose={closeTab}
			onClickAddExisting={canAddExistingRoomToTeam && handleAddExisting}
			onClickCreateNew={canCreateRoomInTeam && handleCreateNew}
			onClickView={goToRoom}
			loadMoreItems={loadMoreItems}
			reload={reload}
		/>
	);
};

export default TeamsChannelsWithData;
