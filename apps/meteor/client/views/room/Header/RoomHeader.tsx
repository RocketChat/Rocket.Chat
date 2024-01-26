import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Header, HeaderAvatar, HeaderContent, HeaderContentRow, HeaderSubtitle, HeaderToolbar } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { Suspense } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import FederatedRoomOriginServer from './FederatedRoomOriginServer';
import ParentRoomWithData from './ParentRoomWithData';
import ParentTeam from './ParentTeam';
import RoomTitle from './RoomTitle';
import RoomToolbox from './RoomToolbox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

export type RoomHeaderProps = {
	room: IRoom;
	topic?: string;
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const RoomHeader = ({ room, topic = '', slots = {} }: RoomHeaderProps) => {
	const t = useTranslation();

	return (
		<Header>
			{slots?.start}
			<HeaderAvatar>
				<RoomAvatar room={room} />
			</HeaderAvatar>
			{slots?.preContent}
			<HeaderContent>
				<HeaderContentRow>
					<RoomTitle room={room} />
					<Favorite room={room} />
					{room.prid && <ParentRoomWithData room={room} />}
					{room.teamId && !room.teamMain && <ParentTeam room={room} />}
					{isRoomFederated(room) && <FederatedRoomOriginServer room={room} />}
					<Encrypted room={room} />
					<Translate room={room} />
					{slots?.insideContent}
				</HeaderContentRow>
				{topic && (
					<HeaderContentRow>
						<HeaderSubtitle is='h2'>
							<MarkdownText pi={2} parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />
						</HeaderSubtitle>
					</HeaderContentRow>
				)}
			</HeaderContent>
			{slots?.posContent}
			<Suspense fallback={null}>
				<HeaderToolbar aria-label={t('Toolbox_room_actions')}>
					{slots?.toolbox?.pre}
					{slots?.toolbox?.content || <RoomToolbox />}
					{slots?.toolbox?.pos}
				</HeaderToolbar>
			</Suspense>
			{slots?.end}
		</Header>
	);
};

export default RoomHeader;
