/* eslint-disable react/no-multi-comp */
import type { IDiscussionMessage, IRoom, ITeam } from '@rocket.chat/core-typings';
import { SidePanel, SidePanelList } from '@rocket.chat/fuselage';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import GenericError from '../../../components/GenericError';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { useOpenedRoom, useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useTeamsChannelList } from '../../teams/contextualBar/channels/hooks/useTeamsChannelList';
import { useDiscussionsList } from '../contextualBar/Discussions/useDiscussionsList';
import RoomSidePanelLoading from './RoomSidePanelLoading';
import RoomSidePanelItem from './SidePanelItem';

type DataResult = {
	room: IRoom | undefined;
	parent?: IRoom | undefined;
	team?: ITeam | undefined;
};

const RoomSidePanel = () => {
	const parentRid = useOpenedRoom();
	const rid = useSecondLevelOpenedRoom() ?? parentRid;

	if (!parentRid || !rid) {
		return null;
	}
	return <RoomSidePanelWithData parentRid={parentRid} openedRoom={rid} />;
};

const shouldShowDiscussions = (data: DataResult) => data?.room?.sidepanel?.items.includes('discussions');
const shouldShowChannels = (data: DataResult) => data?.room?.sidepanel?.items.includes('channels');

const RoomSidePanelWithData = ({ parentRid, openedRoom }: { parentRid: string; openedRoom: string }) => {
	const t = useTranslation();
	const uid = useUserId();
	const { data, isSuccess, isError } = useRoomInfoEndpoint(parentRid);

	const dicsussionOptions = useMemo(
		() => ({
			rid: parentRid,
		}),
		[parentRid],
	);

	const channelOptions = useMemo(
		() =>
			({
				teamId: '',
				roomId: parentRid,
				type: 'all',
				text: '',
			} as const),
		[parentRid],
	);
	// IMPROVE: only fetch discussions IF parent room has sidepanel.items with discussions
	// TODO: get last message from discussion
	// TODO: get discussion avatar
	// TODO: get discussion unread messages
	const { discussionsList } = useDiscussionsList(dicsussionOptions, uid);
	const { phase, error, items: discussions } = useRecordList<IDiscussionMessage>(discussionsList);

	// IMPROVE: only fetch channels IF parent room has sidepanel.items with channels
	// TODO: get channel avatar
	// TODO: get channel unread messages
	const { teamsChannelList } = useTeamsChannelList(channelOptions);
	const { phase: channelsPhase, error: channelsError, items: channels } = useRecordList(teamsChannelList);

	if (isError || error || channelsError || !isSuccess) {
		return (
			<SidePanel>
				<GenericError />
			</SidePanel>
		);
	}
	if (isSuccess && !data.room?.sidepanel) {
		return null;
	}
	if (phase === AsyncStatePhase.LOADING || channelsPhase === AsyncStatePhase.LOADING) {
		return <RoomSidePanelLoading />;
	}

	return (
		<SidePanel>
			<SidePanelList>
				<RoomSidePanelItem id={parentRid} name={t('General')} icon={data.room?.t === 'p' ? 'team-lock' : 'team'} openedRoom={openedRoom} />
				{shouldShowDiscussions(data) &&
					discussions.map((discussion) => (
						<RoomSidePanelItem
							key={discussion.drid}
							id={discussion.drid}
							name={discussion.msg}
							icon='baloons'
							openedRoom={openedRoom}
							{...discussion}
						/>
					))}
				{shouldShowChannels(data) &&
					channels.map((channel) => (
						<RoomSidePanelItem
							key={channel._id}
							id={channel._id}
							name={channel.name}
							icon={channel.t === 'p' ? 'hashtag-lock' : 'hashtag'}
							openedRoom={openedRoom}
							{...channel}
						/>
					))}
			</SidePanelList>
		</SidePanel>
	);
};

export default memo(RoomSidePanel);
