import type { IDiscussionMessage, IRoom } from '@rocket.chat/core-typings';
import {
	Avatar,
	SideBarItem,
	SideBarItemAvatarWrapper,
	SideBarItemIcon,
	SideBarItemTitle,
	SidePanel,
	SidePanelList,
	SidePanelListItem,
	Skeleton,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback, useMemo } from 'react';

import GenericError from '../../../components/GenericError';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import { useSecondLevelOpenedRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { useTeamsChannelList } from '../../teams/contextualBar/channels/hooks/useTeamsChannelList';
import { useDiscussionsList } from '../contextualBar/Discussions/useDiscussionsList';

const RoomSidePanel = ({ rid }: { rid: IRoom['_id'] }) => {
	const { data } = useRoomInfoEndpoint(rid);
	const t = useTranslation();
	const openedRoom = useSecondLevelOpenedRoom() ?? '';

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

	const { discussionsList } = useDiscussionsList(dicsussionOptions, data?.room?.u._id || '');
	const { phase, error, items: discussions } = useRecordList<IDiscussionMessage>(discussionsList);

	const { teamsChannelList, reload } = useTeamsChannelList(channelOptions);
	const { phase: channelsPhase, error: channelsError, items: channels } = useRecordList(teamsChannelList);

	const onClick = useCallback((drid) => {
		goToRoomById(drid);
	}, []);

	if (error || channelsError) {
		return (
			<SidePanel>
				<GenericError buttonAction={reload} buttonTitle={t('Reload')} />
			</SidePanel>
		);
	}
	if (phase === AsyncStatePhase.LOADING || channelsPhase === AsyncStatePhase.LOADING) {
		return (
			<SidePanel>
				<SidePanelList>
					<SideBarItem>
						<Skeleton w='full' />
					</SideBarItem>
					<SideBarItem>
						<Skeleton w='full' />
					</SideBarItem>
					<SideBarItem>
						<Skeleton w='full' />
					</SideBarItem>
				</SidePanelList>
			</SidePanel>
		);
	}
	return (
		<SidePanel>
			<SidePanelList>
				{discussions.map(({ _id, drid, msg }) => (
					<SidePanelListItem key={_id}>
						<SideBarItem selected={_id === openedRoom} onClick={() => onClick(drid)}>
							<SideBarItemAvatarWrapper>
								<Avatar size='x20' url='/avatar/julia.foresti' />
								{/* <Avatar size='x20' url={} alt='avatar' /> */}
							</SideBarItemAvatarWrapper>
							<SideBarItemIcon name='baloons' />
							<SideBarItemTitle>{msg}</SideBarItemTitle>
							{/* <SideBarItemBadge title='unread messages' children={index + 3} /> */}
						</SideBarItem>
					</SidePanelListItem>
				))}
				{channels.map(({ _id, name, t }) => (
					<SidePanelListItem key={_id}>
						<SideBarItem selected={_id === openedRoom} onClick={() => onClick(_id)}>
							<SideBarItemAvatarWrapper>
								<Avatar size='x20' url='/avatar/julia.foresti' />
								{/* <Avatar size='x20' url={} alt='avatar' /> */}
							</SideBarItemAvatarWrapper>
							<SideBarItemIcon name={`hashtag${t === 'p' ? '-lock' : ''}`} />
							<SideBarItemTitle>{name}</SideBarItemTitle>
							{/* <SideBarItemBadge title='unread messages' children={index + 3} /> */}
							{/* <SideBarItemMenu children={<MenuTemplate />} /> */}
						</SideBarItem>
					</SidePanelListItem>
				))}
			</SidePanelList>
		</SidePanel>
	);
};

export default memo(RoomSidePanel);
