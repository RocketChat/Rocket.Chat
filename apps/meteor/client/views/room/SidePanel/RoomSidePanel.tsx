import type { IDiscussionMessage, IRoom, ITeam } from '@rocket.chat/core-typings';
import { SidePanel, SidePanelList } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import GenericError from '../../../components/GenericError';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
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

const shouldShowDiscussions = (data: DataResult) =>
	data?.parent?.sidepanel?.items.includes('discussions') || data?.room?.sidepanel?.items.includes('discussions');
const shouldShowChannels = (data: DataResult) =>
	data?.parent?.sidepanel?.items.includes('channels') || data?.room?.sidepanel?.items.includes('channels');

const RoomSidePanel = ({ rid }: { rid: IRoom['_id'] }) => {
	const { data, isSuccess, isError } = useRoomInfoEndpoint(rid);
	const t = useTranslation();

	const dicsussionOptions = useMemo(
		() => ({
			rid: data?.parent?._id || rid,
		}),
		[data?.parent?._id, rid],
	);

	const channelOptions = useMemo(
		() =>
			({
				teamId: data?.team?._id || '',
				...(!data?.room?.teamMain && { roomId: data?.parent?._id }),
				type: 'all',
				text: '',
			} as const),
		[data?.parent?._id, data?.room?.teamMain, data?.team?._id],
	);

	// IMPROVE: only fetch discussions IF parent room has sidepanel.items with discussions
	// TODO: get last message from discussion
	// TODO: get discussion avatar
	// TODO: get discussion unread messages
	const { discussionsList } = useDiscussionsList(dicsussionOptions, data?.room?.u._id || '');
	const { phase, error, items: discussions } = useRecordList<IDiscussionMessage>(discussionsList);

	// IMPROVE: only fetch channels IF parent room has sidepanel.items with channels
	// TODO: get channel avatar
	// TODO: get channel unread messages
	const { teamsChannelList, reload } = useTeamsChannelList(channelOptions);
	const { phase: channelsPhase, error: channelsError, items: channels } = useRecordList(teamsChannelList);

	if (isError || error || channelsError || !isSuccess) {
		return (
			<SidePanel>
				<GenericError buttonAction={reload} buttonTitle={t('Reload')} />
			</SidePanel>
		);
	}
	if (isSuccess && !data.room?.sidepanel && !data.parent?.sidepanel) {
		return null;
	}
	if (phase === AsyncStatePhase.LOADING || channelsPhase === AsyncStatePhase.LOADING) {
		return <RoomSidePanelLoading />;
	}
	return (
		<SidePanel>
			<SidePanelList>
				<RoomSidePanelItem id={data.parent?._id} name={t('General')} icon={(data.parent || data.room)?.t === 'p' ? 'team-lock' : 'team'} />
				{shouldShowDiscussions(data) &&
					discussions.map((data) => <RoomSidePanelItem key={data.drid} id={data.drid} name={data.msg} icon='baloons' {...data} />)}
				{shouldShowChannels(data) &&
					channels.map((data) => (
						<RoomSidePanelItem key={data._id} id={data._id} name={data.name} icon={data.t === 'p' ? 'hashtag-lock' : 'hashtag'} {...data} />
					))}
			</SidePanelList>
		</SidePanel>
	);
};

export default memo(RoomSidePanel);
