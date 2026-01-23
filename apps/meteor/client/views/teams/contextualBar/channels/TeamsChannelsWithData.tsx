import type { IRoom } from '@rocket.chat/core-typings';
import { useLocalStorage, useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, usePermission, useAtLeastOnePermission, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';

import AddExistingModal from './AddExistingModal';
import TeamsChannels from './TeamsChannels';
import { useTeamsChannelList } from './hooks/useTeamsChannelList';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import CreateChannelModal from '../../../../navbar/NavBarPagesGroup/actions/CreateChannelModal';
import { useRoom } from '../../../room/contexts/RoomContext';

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

	const { isPending, data, fetchNextPage, refetch } = useTeamsChannelList({ teamId, text: debouncedText, type });

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const handleAddExisting = useEffectEvent(() => {
		setModal(<AddExistingModal teamId={teamId} onClose={() => setModal(null)} reload={refetch} />);
	});

	const handleCreateNew = useEffectEvent(() => {
		setModal(<CreateChannelModal teamId={teamId} mainRoom={room} onClose={() => setModal(null)} reload={refetch} />);
	});

	const goToRoom = useEffectEvent((room: IRoom) => {
		roomCoordinator.openRouteLink(room.t, room);
	});

	return (
		<TeamsChannels
			loading={isPending}
			mainRoom={room}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			channels={data?.channels ?? []}
			total={data?.total ?? 0}
			onClickClose={closeTab}
			onClickAddExisting={canAddExistingRoomToTeam && handleAddExisting}
			onClickCreateNew={canCreateRoomInTeam && handleCreateNew}
			onClickView={goToRoom}
			loadMoreItems={fetchNextPage}
			reload={refetch}
		/>
	);
};

export default TeamsChannelsWithData;
